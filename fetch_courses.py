"""
InternHunt — Free-certificate course fetcher.
Only accepts pages from official company domains, never third-party/aggregator sites.
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

# Only these official domains are ever accepted — no third-party aggregators.
ALLOWED_DOMAINS = [
    "cloudskillsboost.google", "learndigital.withgoogle.com", "grow.google",
    "learn.microsoft.com", "aws.amazon.com", "nvidia.com",
    "skillsbuild.org", "freecodecamp.org", "academy.hubspot.com",
    "infyspringboard.onwingspan.com", "skillsforall.com",
    "trailhead.salesforce.com", "mylearn.oracle.com", "training.fortinet.com",
    "paloaltonetworks.com", "kaggle.com", "mygreatlearning.com",
    "developers.google.com",
]

SEARCH_QUERIES = [
    "site:cloudskillsboost.google free certificate",
    "site:learn.microsoft.com free certification path",
    "site:aws.amazon.com skill builder free course certificate",
    "site:nvidia.com deep learning institute free course",
    "site:skillsbuild.org free certificate course",
    "site:freecodecamp.org certification",
    "site:academy.hubspot.com free certification",
    "site:skillsforall.com free course certificate",
    "site:trailhead.salesforce.com free badge",
    "site:training.fortinet.com free certification",
]

RESULTS_PER_QUERY = 6
MAX_PAGE_CHARS = 6000
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 1.0


def duckduckgo_search(query: str, num: int = RESULTS_PER_QUERY):
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


def domain_of(url: str) -> str:
    match = re.search(r"https?://(?:www\.)?([^/]+)", url)
    return match.group(1).lower() if match else ""


def is_allowed_domain(url: str) -> bool:
    d = domain_of(url)
    return any(d == allowed or d.endswith("." + allowed) for allowed in ALLOWED_DOMAINS)


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


def extract_course_from_page(source_url: str, page_text: str):
    prompt = (
        "Here is text scraped from an official company training/learning web page. "
        "Determine if this page describes ONE specific course or learning path that "
        "issues a certificate or completion badge. Be strict: only say yes if you can "
        "clearly tell whether the CERTIFICATE ITSELF is free (not just the course "
        "content) or whether the certificate costs money / requires payment.\n\n"
        'Respond with ONLY JSON, no markdown, no explanation:\n'
        '{"is_course": true/false, "title": "...", "provider": "...", '
        '"category": "one of Cloud, AI/ML, Web Dev, Data, Marketing, General", '
        '"duration": "..." or null, "cert_free": true/false, '
        '"confidence": "high" or "low"}\n\n'
        "If this is not a specific course page, respond with exactly: "
        '{"is_course": false}\n\n'
        f"PAGE TEXT:\n{page_text[:MAX_PAGE_CHARS]}"
    )
    text = call_gemini(prompt)
    if not text:
        return None

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None

    try:
        parsed = json.loads(match.group(0))
        if not isinstance(parsed, dict) or not parsed.get("is_course"):
            return None
        if parsed.get("confidence") != "high":
            return None
        if not parsed.get("title") or not parsed.get("provider"):
            return None
        return {
            "title": parsed["title"].strip(),
            "provider": parsed["provider"].strip(),
            "category": parsed.get("category") or "General",
            "duration": parsed.get("duration"),
            "cert_free": bool(parsed.get("cert_free")),
        }
    except Exception:
        return None


def make_source_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:40]


def save_to_supabase(courses: list):
    if not courses:
        return []

    url = f"{SUPABASE_URL}/rest/v1/course_staging"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=representation",
    }
    params = {"on_conflict": "source,source_id"}

    try:
        res = requests.post(url, headers=headers, params=params, json=courses, timeout=30)
        if not res.ok:
            print(f"  [supabase error] {res.status_code}: {res.text[:300]}")
            return []
        return res.json()
    except Exception as e:
        print(f"  [supabase error] {e}")
        return []


def notify_telegram(new_courses: list):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID or not new_courses:
        return

    preview = "\n".join(f"• {c['title']} — {c['provider']}" for c in new_courses[:5])
    more = f"\n...and {len(new_courses) - 5} more" if len(new_courses) > 5 else ""
    text = (
        f"🎓 InternHunt: {len(new_courses)} new course"
        f"{'s' if len(new_courses) > 1 else ''} waiting for approval\n\n"
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
    print(f"Starting course fetch with {len(SEARCH_QUERIES)} search queries...")

    all_candidate_urls = set()
    for query in SEARCH_QUERIES:
        print(f"Searching: {query}")
        urls = duckduckgo_search(query)
        all_candidate_urls.update(u for u in urls if is_allowed_domain(u))
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Found {len(all_candidate_urls)} candidate pages on official domains.")

    all_courses = []
    for url in all_candidate_urls:
        page_text = fetch_page_text(url)
        if not page_text:
            continue

        extracted = extract_course_from_page(url, page_text)
        if not extracted:
            continue

        extracted["domain"] = domain_of(url)
        extracted["url"] = url
        extracted["source"] = "web-search"
        extracted["source_id"] = make_source_id(url)
        all_courses.append(extracted)

        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Extracted {len(all_courses)} candidate courses total.")

    newly_inserted = save_to_supabase(all_courses)
    print(f"Newly inserted into course_staging: {len(newly_inserted)}")

    if newly_inserted:
        notify_telegram(newly_inserted)
        print("Telegram notification sent.")

    print("Done.")


if __name__ == "__main__":
    main()