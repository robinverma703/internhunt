"""
InternHunt — Internet-wide job fetcher.
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
    "software engineering internship India apply",
    "data science internship India hiring",
    "frontend developer internship India",
    "backend developer internship India",
    "machine learning internship India",
    "product management internship India",
    "UI UX design internship India",
    "marketing internship India tech startup",
    "internship hiring 2026 India careers page",
    "remote internship India tech",
]

RESULTS_PER_QUERY = 8
MAX_PAGE_CHARS = 6000
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 1.0


def duckduckgo_search(query: str, num: int = RESULTS_PER_QUERY):
    """Runs one DuckDuckGo search — free, no API key or card needed."""
    url = "https://html.duckduckgo.com/html/"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; InternHuntBot/1.0)"}
    try:
        res = requests.post(url, data={"q": query}, headers=headers, timeout=REQUEST_TIMEOUT)
        if not res.ok:
            return []
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
        print(f"  [search error] '{query}': {e}")
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


def extract_jobs_from_page(source_url: str, page_text: str):
    prompt = (
        "Here is text scraped from a careers/job listing web page. "
        "Extract any INTERNSHIP or entry-level JOB postings you can find, "
        "for ANY tech-related field (software, data, design, marketing, "
        "product, etc). For each one, give: title, company name, and a "
        "direct application link if visible in the text (else null).\n\n"
        'Respond with ONLY a JSON array, no markdown, no explanation:\n'
        '[{"title":"...","company":"...","link":"..." or null}]\n'
        "If there are no relevant postings, respond with exactly: []\n\n"
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
        for j in parsed:
            if not isinstance(j, dict) or not j.get("title"):
                continue
            cleaned.append(
                {
                    "title": j.get("title", "").strip(),
                    "company": (j.get("company") or "Unknown").strip(),
                    "link": j.get("link") or source_url,
                }
            )
        return cleaned
    except Exception:
        return []


CATEGORY_RULES = [
    (r"(frontend|react|next\.js|vue|angular)", "Frontend"),
    (r"(backend|node|django|rails|api)", "Backend"),
    (r"(full[\s-]?stack)", "Full Stack"),
    (r"(data|analytics|ml|machine learning|ai)", "Data / AI"),
    (r"(design|ui|ux)", "Design"),
    (r"(market|sales|growth|content)", "Marketing"),
    (r"(product)", "Product"),
    (r"(intern)", "Internship"),
]


def guess_category(title: str) -> str:
    t = title.lower()
    for pattern, label in CATEGORY_RULES:
        if re.search(pattern, t):
            return label
    return "General"


HARD_REJECT_PATTERNS = [
    r"registration\s*fee",
    r"security\s*deposit",
    r"pay\s*(a\s*)?(small\s*)?fee",
    r"refundable\s*deposit",
    r"investment\s*required",
    r"joining\s*fee",
    r"whatsapp\s*only",
    r"telegram\s*only",
]


def is_probably_scam(job: dict) -> bool:
    text = f"{job['title']} {job['company']}".lower()
    return any(re.search(p, text) for p in HARD_REJECT_PATTERNS)


def make_source_id(job: dict) -> str:
    raw = f"{job['company']}-{job['title']}-{job['link']}"
    return hashlib.sha256(raw.encode()).hexdigest()[:40]


def save_to_supabase(jobs: list):
    if not jobs:
        return []

    url = f"{SUPABASE_URL}/rest/v1/job_staging"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=representation",
    }
    params = {"on_conflict": "source,source_id"}

    try:
        res = requests.post(
            url, headers=headers, params=params, json=jobs, timeout=30
        )
        if not res.ok:
            print(f"  [supabase error] {res.status_code}: {res.text[:300]}")
            return []
        return res.json()
    except Exception as e:
        print(f"  [supabase error] {e}")
        return []


def notify_telegram(new_jobs: list):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID or not new_jobs:
        return

    preview = "\n".join(
        f"• {j['title']} — {j['company']}" for j in new_jobs[:5]
    )
    more = f"\n...and {len(new_jobs) - 5} more" if len(new_jobs) > 5 else ""
    text = (
        f"🟢 InternHunt: {len(new_jobs)} new job"
        f"{'s' if len(new_jobs) > 1 else ''} waiting for approval\n\n"
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
    print(f"Starting run with {len(SEARCH_QUERIES)} search queries...")

    all_candidate_urls = set()
    for query in SEARCH_QUERIES:
        print(f"Searching: {query}")
        urls = duckduckgo_search(query)
        all_candidate_urls.update(urls)
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Found {len(all_candidate_urls)} unique pages to check.")

    all_jobs = []
    for url in all_candidate_urls:
        page_text = fetch_page_text(url)
        if not page_text:
            continue

        extracted = extract_jobs_from_page(url, page_text)
        for job in extracted:
            if is_probably_scam(job):
                continue
            job["description"] = f"Found via web search at {url}. Verify details before approving."
            job["stipend"] = None
            job["category"] = guess_category(job["title"])
            job["source"] = "web-search"
            job["source_id"] = make_source_id(job)
            job["location"] = None
            job["flags"] = ["Auto-discovered via internet search — verify carefully before approving"]
            all_jobs.append(job)

        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Extracted {len(all_jobs)} candidate jobs total.")

    newly_inserted = save_to_supabase(all_jobs)
    print(f"Newly inserted into job_staging: {len(newly_inserted)}")

    if newly_inserted:
        notify_telegram(newly_inserted)
        print("Telegram notification sent.")

    print("Done.")


if __name__ == "__main__":
    main()