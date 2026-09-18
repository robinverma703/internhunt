"""
InternHunt — Hackathon fetcher.
Primary source: Unstop's public data API (reliable, structured, no scraping/
search-engine blocking issues). Secondary: web-search + Gemini extraction,
kept as a bonus discovery layer for broader/other sources.
Finds live/upcoming hackathons — Gurgaon/Delhi NCR first, then rest of India,
then international — and stages them for admin approval.
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

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 1.0

# ============================================================
# PRIMARY SOURCE — Unstop's public data API
# (no key needed, no login, not blocked like search engines)
# ============================================================

UNSTOP_PAGES_TO_FETCH = 3  # ~50 hackathons per page


def fetch_from_unstop():
    all_items = []
    for page in range(1, UNSTOP_PAGES_TO_FETCH + 1):
        url = "https://unstop.com/api/public/opportunity/search-result"
        params = {
            "opportunity": "hackathons",
            "page": page,
            "per_page": 50,
            "sortBy": "",
            "orderBy": "",
            "filter_condition": "",
        }
        headers = {
            "User-Agent": BROWSER_UA,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://unstop.com/hackathons",
            "Origin": "https://unstop.com",
        }
    
        try:
            res = requests.get(url, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
            if not res.ok:
                print(f"  [unstop error] page {page}: status {res.status_code}")
                break
            payload = res.json()
            items = (payload.get("data") or {}).get("data") or []
            if not items:
                break
            all_items.extend(items)
        except Exception as e:
            print(f"  [unstop error] page {page}: {e}")
            break
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"  [unstop] fetched {len(all_items)} raw items from the API")

    results = []
    for item in all_items:
        title = (item.get("title") or "").strip()
        if not title:
            continue

        public_url = item.get("public_url")
        link = f"https://unstop.com/{public_url}" if public_url else "https://unstop.com/hackathons"

        organizer = ((item.get("organisation") or {}).get("name") or "Unstop").strip()

        city = (item.get("address_with_country_logo") or {}).get("city")
        region = item.get("region")
        mode = "Offline" if city else ("Online" if region == "online" else "Online")

        reg = item.get("regnRequirements") or {}
        reg_deadline = reg.get("end_regn_dt")
        reg_deadline = reg_deadline.split("T")[0] if reg_deadline else None

        end_date = item.get("end_date")
        end_date = end_date.split("T")[0] if end_date else None

        prize = None
        prizes = item.get("prizes") or []
        if prizes:
            top = prizes[0]
            cash = top.get("cash")
            if cash:
                prize = f"₹{cash:,}"
            elif top.get("others"):
                prize = top["others"][:80]

        
        results.append(
            {
                "title": title,
                "organizer": organizer,
                "mode": mode,
                "location": city,
                "start_date": None,
                "end_date": end_date,
                "registration_deadline": reg_deadline,
                "prize": prize,
                "link": link,
                "source": "unstop",
                "source_id": str(item.get("id")),
            }
        )

    return results


# ============================================================
# SECONDARY SOURCE — web search + Gemini extraction
# (kept as a bonus layer; DuckDuckGo/Bing may be blocked from
# some CI environments, so this can legitimately return little)
# ============================================================

SEARCH_QUERIES = [
    # Priority 1 — Gurgaon / Delhi NCR
    "hackathon Gurgaon 2026 register",
    "hackathon Gurugram college 2026",
    "hackathon Delhi NCR 2026 apply",
    "corporate hackathon Gurgaon Delhi 2026",
    "Devfolio hackathon Delhi NCR Gurgaon",
    "college hackathon Delhi 2026 register",
    # Priority 2 — rest of India
    "college hackathon India 2026 register",
    "university hackathon India 2026 apply",
    "corporate hackathon India 2026 hiring challenge",
    "Devfolio hackathon India registration open",
    "online hackathon India students 2026",
    "national level hackathon India 2026",
    # Priority 3 — international
    "international hackathon 2026 open worldwide students register",
    "global online hackathon 2026 students apply",
]

RESULTS_PER_QUERY = 8
MAX_PAGE_CHARS = 6000


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


def web_search(query: str, num: int = RESULTS_PER_QUERY):
    links = _duckduckgo_lite(query, num)
    if links:
        return links
    return _bing_search(query, num)


def strip_html(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]*>", " ", html)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def fetch_page_text(url: str):
    try:
        headers = {"User-Agent": BROWSER_UA}
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
        "- prize (short text like \"\u20b950,000\" or \"Certificates + Swag\", or null)\n"
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
                    "source": "web-search",
                    "source_id": None,
                }
            )
        return cleaned
    except Exception:
        return []


def fetch_from_web_search():
    all_candidate_urls = set()
    for query in SEARCH_QUERIES:
        print(f"  Searching: {query}")
        urls = web_search(query)
        all_candidate_urls.update(urls)
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"  [web-search] found {len(all_candidate_urls)} unique pages to check")

    results = []
    for url in all_candidate_urls:
        page_text = fetch_page_text(url)
        if not page_text:
            continue
        extracted = extract_hackathons_from_page(url, page_text)
        results.extend(extracted)
        time.sleep(SLEEP_BETWEEN_CALLS)

    return results


# ============================================================
# Shared helpers
# ============================================================


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
    r"registration\s*fee\s*\u20b9?\s*[5-9]\d{3,}",
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
        res = requests.post(url, headers=headers, params=params, json=hackathons, timeout=30)
        if not res.ok:
            print(f"  [supabase error] {res.status_code}: {res.text[:300]}")
            return []
        return res.json()
    except Exception as e:
        print(f"  [supabase error] {e}")
        return []

def cleanup_expired_live_hackathons():
    """Removes hackathons from the LIVE table once registration has closed."""
    url = f"{SUPABASE_URL}/rest/v1/hackathons"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    today = time.strftime("%Y-%m-%d")
    params = {"registration_deadline": f"lt.{today}"}
    try:
        res = requests.delete(url, headers=headers, params=params, timeout=30)
        if res.ok:
            print(f"  [cleanup] removed expired hackathons from live site (before {today})")
        else:
            print(f"  [cleanup error] {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print(f"  [cleanup error] {e}")


def notify_telegram(new_hackathons: list):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID or not new_hackathons:
        return

    preview = "\n".join(f"\u2022 {h['title']} \u2014 {h['organizer']}" for h in new_hackathons[:5])
    more = f"\n...and {len(new_hackathons) - 5} more" if len(new_hackathons) > 5 else ""
    text = (
        f"\U0001f7e0 InternHunt: {len(new_hackathons)} new hackathon"
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

# ============================================================
# THIRD SOURCE — direct company career/hackathon pages
# (AI-guessed, same pattern as the internship discovery agent)
# ============================================================

CORPORATE_HACKATHON_COMPANIES = [
    "Flipkart", "Microsoft India", "Google India", "Amazon India",
    "Adobe India", "Walmart Global Tech", "Swiggy", "Zomato", "Paytm",
    "PhonePe", "Razorpay", "CRED", "Meesho", "Groww", "Zerodha",
    "Mastercard", "Visa", "American Express", "Goldman Sachs India",
    "JPMorgan Chase India", "Morgan Stanley India", "Wells Fargo India",
    "IBM India", "Intuit India", "Salesforce India", "Oracle India",
    "SAP Labs India", "Dell Technologies India", "Cisco India",
    "Nvidia India", "Qualcomm India", "Samsung R&D India",
    "Tata Consultancy Services", "Infosys", "Wipro", "HCLTech",
    "Tech Mahindra", "LTIMindtree", "Ola", "Uber India",
]


def guess_company_hackathon_url(company: str):
    prompt = (
        f"Does {company} currently run a public hackathon, coding challenge, "
        f"or student developer competition? If yes, give ONLY the direct URL "
        f"to that hackathon/competition page. If they don't run one right now, "
        f"reply with exactly: NONE\n"
        f"Reply with nothing except the URL or NONE \u2014 no explanation."
    )
    text = call_gemini(prompt)
    if not text:
        return None
    text = text.strip().split()[0] if text.strip() else ""
    if not text.startswith("http"):
        return None
    return text


def fetch_from_company_pages():
    results = []
    for company in CORPORATE_HACKATHON_COMPANIES:
        print(f"  Checking: {company}")
        url = guess_company_hackathon_url(company)
        if not url:
            time.sleep(SLEEP_BETWEEN_CALLS)
            continue

        page_text = fetch_page_text(url)
        if not page_text:
            time.sleep(SLEEP_BETWEEN_CALLS)
            continue

        extracted = extract_hackathons_from_page(url, page_text)
        for h in extracted:
            if not h.get("organizer") or h["organizer"] == "Unknown":
                h["organizer"] = company
            h["category"] = "Corporate"
            h["source"] = "company-site"
        results.extend(extracted)
        time.sleep(SLEEP_BETWEEN_CALLS)

    return results
def main():
    print("Starting hackathon run...")

    print("Fetching from Unstop (primary source)...")
    unstop_hackathons = fetch_from_unstop()

    print("Fetching via web search (secondary/bonus source)...")
    search_hackathons = fetch_from_web_search()

    print("Fetching directly from corporate/company pages (your main focus)...")
    company_hackathons = fetch_from_company_pages()

    all_hackathons = unstop_hackathons + search_hackathons + company_hackathons

    final = []
    for h in all_hackathons:
        if is_probably_scam(h):
            continue
        if "description" not in h:
            h["description"] = f"Sourced from {h['source']}. Verify details before approving."
        if "category" not in h or not h.get("category"):
            h["category"] = guess_category(h["organizer"], h["title"])
        if not h.get("source_id"):
            h["source_id"] = make_source_id(h)
        if "flags" not in h:
            h["flags"] = (
                ["Sourced directly from Unstop's public listings"]
                if h["source"] == "unstop"
                else ["Auto-discovered via internet search — verify carefully before approving"]
            )
        final.append(h)

        print(f"Total candidate hackathons: {len(final)} (Unstop: {len(unstop_hackathons)}, web-search: {len(search_hackathons)}, company-sites: {len(company_hackathons)})")

    newly_inserted = save_to_supabase(final)
    print(f"Newly inserted into hackathons_staging: {len(newly_inserted)}")

    if newly_inserted:
        notify_telegram(newly_inserted)
        print("Telegram notification sent.")

    cleanup_expired_live_hackathons()
    print("Done.")


if __name__ == "__main__":
    main()