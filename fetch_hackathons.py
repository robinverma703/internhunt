"""
InternHunt — Hackathon fetcher.
Finds live/upcoming hackathons — Gurgaon/Delhi NCR first, then rest of India,
then international — and stages them for admin approval, same pattern as fetch_jobs.py.
"""

import os
import re
import json
import time
import hashlib
import requests

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

SEARCH_QUERIES = [
    # Priority 1 — Gurgaon / Delhi NCR
    "hackathon Gurgaon 2026 register",
    "hackathon Gurugram college 2026",
    "hackathon Delhi NCR 2026 apply",
    "corporate hackathon Gurgaon Delhi 2026",
    "Unstop hackathon Delhi NCR",
    "Devfolio hackathon Delhi NCR Gurgaon",
    "college hackathon Delhi 2026 register",
    # Priority 2 — rest of India
    "college hackathon India 2026 register",
    "university hackathon India 2026 apply",
    "corporate hackathon India 2026 hiring challenge",
    "Unstop hackathon India registration open",
    "Devfolio hackathon India registration open",
    "online hackathon India students 2026",
    "hackathon prize money India college students",
    "national level hackathon India 2026",
    "student hackathon India free entry 2026",
    # Priority 3 — international
    "international hackathon 2026 open worldwide students register",
    "global online hackathon 2026 students apply",
]

RESULTS_PER_QUERY = 8
MAX_PAGE_CHARS = 6000
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 1.0


BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def duckduckgo_search(query: str, num: int = RESULTS_PER_QUERY):
    """Tries DuckDuckGo's lite endpoint first, then falls back to Bing if blocked."""
    links = _duckduckgo_lite(query, num)
    if links:
        return links
    print(f"  [ddg empty] falling back to Bing for: '{query}'")
    return _bing_search(query, num)


def _duckduckgo_lite(query: str, num: int):
    url = "https://lite.duckduckgo.com/lite/"
    headers = {"User-Agent": BROWSER_UA}
    try:
        res = requests.post(url, data={"q": query}, headers=headers, timeout=REQUEST_TIMEOUT)
        if not res.ok:
            return []
        raw_links = re.findall(r'<a[^>]+class="result-link"[^>]+href="([^"]+)"', res.text)
        if not raw_links:
            raw_links = re.findall(r'class="result__a"[^>]*href="([^"]+)"', res.text)
        links = []
        for link in raw_links[:num]:
            match = re.search(r"uddg=([^&]+)", link)
            if match:
                links.append(requests.utils.unquote(match.group(1)))
            elif link.startswith("http"):
                links.append(link)
        return links
    except Exception as e:
        print(f"  [ddg error] '{query}': {e}")
        return []


def _bing_search(query: str, num: int):
    url = "https://www.bing.com/search"
    headers = {"User-Agent": BROWSER_UA}
    try:
        res = requests.get(url, params={"q": query}, headers=headers, timeout=REQUEST_TIMEOUT)
        if not res.ok:
            return []
        raw_links = re.findall(r'<li class="b_algo"[\s\S]*?<a href="([^"]+)"', res.text)
        return raw_links[:num]
    except Exception as e:
        print(f"  [bing error] '{query}': {e}")
        return []


def strip_html(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]*>", " ", html)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def fetch_page_text(url: str):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; InternHuntBot/1.0)"}
        res = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if not res.ok:
            return None
        text = strip_html(res.text)
        return text if len(text) > 200 else None
    except Exception:
        return None


def call_gemini(prompt: str):
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-flash-lite-latest:generateContent?key={GEMINI_API_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0},
    }
    try:
        res = requests.post(url, json=body, timeout=REQUEST_TIMEOUT)
        if not res.ok:
            return None
        data = res.json()
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    except Exception as e:
        print(f"  [gemini error] {e}")
        return None


def extract_hackathons_from_page(source_url: str, page_text: str):
    prompt = (
        "Here is text scraped from a web page that may list one or more HACKATHONS "
        "(college, university, or corporate) open to students/developers in India. "
        "Extract every hackathon you can find. For each one, give:\n"
        "- title\n"
        "- organizer (college/university/company name)\n"
        "- mode: \"Online\", \"Offline\", or \"Hybrid\"\n"
        "- location (city, or null if online/not mentioned)\n"
        "- start_date (YYYY-MM-DD, or null if not visible)\n"
        "- end_date (YYYY-MM-DD, or null if not visible)\n"
        "- registration_deadline (YYYY-MM-DD, or null if not visible)\n"
        "- prize (short text like \"₹50,000\" or \"Certificates + Swag\", or null)\n"
        "- link (direct registration/details link if visible, else null)\n\n"
        'Respond with ONLY a JSON array, no markdown, no explanation:\n'
        '[{"title":"...","organizer":"...","mode":"Online","location":null,'
        '"start_date":null,"end_date":null,"registration_deadline":null,'
        '"prize":null,"link":null}]\n'
        "If there are no hackathons visible, respond with exactly: []\n\n"
        f"PAGE TEXT:\n{page_text[:MAX_PAGE_CHARS]}"
    )
    text = call_gemini(prompt)
    if not text:
        return []

    match = re.search(r"\[[\s\S]*\]", text)
    if not match:
        return []

    try:
        parsed = json.loads(match.group(0))
        if not isinstance(parsed, list):
            return []
        cleaned = []
        for h in parsed:
            if not isinstance(h, dict) or not h.get("title"):
                continue
            cleaned.append(
                {
                    "title": h.get("title", "").strip(),
                    "organizer": (h.get("organizer") or "Unknown").strip(),
                    "mode": h.get("mode") if h.get("mode") in ("Online", "Offline", "Hybrid") else "Online",
                    "location": h.get("location") or None,
                    "start_date": h.get("start_date") or None,
                    "end_date": h.get("end_date") or None,
                    "registration_deadline": h.get("registration_deadline") or None,
                    "prize": h.get("prize") or None,
                    "link": h.get("link") or source_url,
                }
            )
        return cleaned
    except Exception:
        return []


def guess_category(organizer: str, title: str) -> str:
    text = f"{organizer} {title}".lower()
    corporate_hints = [
        "technologies", "pvt", "ltd", "inc", "corp", "solutions", "systems",
        "labs", "microsoft", "google", "amazon", "adobe", "infosys", "tcs",
        "wipro", "accenture", "flipkart",
    ]
    college_hints = [
        "college", "university", "institute", "iit", "nit", "vit", "srm",
        "amity", "school of", "engineering college", "polytechnic",
    ]
    if any(h in text for h in college_hints):
        return "College"
    if any(h in text for h in corporate_hints):
        return "Corporate"
    return "Open"


HARD_REJECT_PATTERNS = [
    r"registration\s*fee\s*\u20b9?\s*[5-9]\d{3,}",  # only reject if fee looks unreasonably high
    r"pay\s*(a\s*)?deposit",
    r"whatsapp\s*only",
]


def is_probably_scam(h: dict) -> bool:
    text = f"{h['title']} {h['organizer']}".lower()
    return any(re.search(p, text) for p in HARD_REJECT_PATTERNS)


def make_source_id(h: dict) -> str:
    raw = f"{h['organizer']}-{h['title']}-{h['link']}"
    return hashlib.sha256(raw.encode()).hexdigest()[:40]


def save_to_supabase(hackathons: list):
    if not hackathons:
        return []

    url = f"{SUPABASE_URL}/rest/v1/hackathons_staging"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=representation",
    }
    params = {"on_conflict": "source,source_id"}

    try:
        res = requests.post(
            url, headers=headers, params=params, json=hackathons, timeout=30
        )
        if not res.ok:
            print(f"  [supabase error] {res.status_code}: {res.text[:300]}")
            return []
        return res.json()
    except Exception as e:
        print(f"  [supabase error] {e}")
        return []


def notify_telegram(new_hackathons: list):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID or not new_hackathons:
        return

    preview = "\n".join(
        f"• {h['title']} — {h['organizer']}" for h in new_hackathons[:5]
    )
    more = f"\n...and {len(new_hackathons) - 5} more" if len(new_hackathons) > 5 else ""
    text = (
        f"🟠 InternHunt: {len(new_hackathons)} new hackathon"
        f"{'s' if len(new_hackathons) > 1 else ''} waiting for approval\n\n"
        f"{preview}{more}\n\nCheck the admin panel to approve/reject."
    )
    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text},
            timeout=10,
        )
    except Exception as e:
        print(f"  [telegram error] {e}")


def main():
    print(f"Starting hackathon run with {len(SEARCH_QUERIES)} search queries...")

    all_candidate_urls = set()
    for query in SEARCH_QUERIES:
        print(f"Searching: {query}")
        urls = duckduckgo_search(query)
        all_candidate_urls.update(urls)
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Found {len(all_candidate_urls)} unique pages to check.")

    all_hackathons = []
    for url in all_candidate_urls:
        page_text = fetch_page_text(url)
        if not page_text:
            continue

        extracted = extract_hackathons_from_page(url, page_text)
        for h in extracted:
            if is_probably_scam(h):
                continue
            h["description"] = f"Found via web search at {url}. Verify details before approving."
            h["category"] = guess_category(h["organizer"], h["title"])
            h["source"] = "web-search"
            h["source_id"] = make_source_id(h)
            h["flags"] = ["Auto-discovered via internet search — verify carefully before approving"]
            all_hackathons.append(h)

        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Extracted {len(all_hackathons)} candidate hackathons total.")

    newly_inserted = save_to_supabase(all_hackathons)
    print(f"Newly inserted into hackathons_staging: {len(newly_inserted)}")

    if newly_inserted:
        notify_telegram(newly_inserted)
        print("Telegram notification sent.")

    print("Done.")


if __name__ == "__main__":
    main()