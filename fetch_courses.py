"""
InternHunt — Free-certificate course fetcher.
Crawls known official "course catalog" hub pages directly (no search engine
involved, so nothing to block), extracts individual course links, then
verifies each one with Gemini before it can enter the review queue.
"""

import os
import re
import json
import time
import random
import hashlib
import requests

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

HUB_PAGES = [
    "https://www.cloudskillsboost.google/catalog",
    "https://learndigital.withgoogle.com/digitalgarage/courses",
    "https://learn.microsoft.com/en-us/training/browse/",
    "https://aws.amazon.com/training/digital/",
    "https://www.nvidia.com/en-us/training/online/",
    "https://skillsbuild.org/students/course-catalog",
    "https://www.freecodecamp.org/learn",
    "https://academy.hubspot.com/courses",
    "https://www.skillsforall.com/courses",
    "https://trailhead.salesforce.com/content/learn/trails",
    "https://training.fortinet.com/local/staticpage/view.php?page=library_nse_certification",
    "https://www.paloaltonetworks.com/cybersecurity-academy",
    "https://www.kaggle.com/learn",
    "https://www.mygreatlearning.com/academy",
    "https://www.hp.com/us-en/hp-life.html",
    "https://developer.mozilla.org/en-US/curriculum/",
    "https://university.mongodb.com/courses/catalog",
    "https://university.atlassian.com/student/catalog",
    "https://www.databricks.com/learn/training/catalog",
    "https://skills.github.com/",
]

ALLOWED_DOMAINS = [
    "cloudskillsboost.google", "learndigital.withgoogle.com", "grow.google",
    "developers.google.com", "digitalgarage.google",
    "learn.microsoft.com", "aka.ms",
    "aws.amazon.com", "explore.skillbuilder.aws",
    "nvidia.com", "courses.nvidia.com",
    "skillsbuild.org", "ibm.com",
    "freecodecamp.org",
    "academy.hubspot.com",
    "infyspringboard.onwingspan.com",
    "skillsforall.com", "netacad.com",
    "trailhead.salesforce.com",
    "mylearn.oracle.com",
    "training.fortinet.com",
    "paloaltonetworks.com",
    "kaggle.com",
    "mygreatlearning.com",
    "alison.com",
    "hp.com",
    "developer.mozilla.org",
    "facebookblueprint.com", "meta.com",
    "coursera.org",
    "edx.org",
    "khanacademy.org",
    "simplilearn.com",
    "adobe.com",
    "university.atlassian.com",
    "databricks.com",
    "redhat.com",
    "university.mongodb.com", "mongodb.com",
    "docker.com",
    "skills.github.com", "github.com",
]

MAX_PAGE_CHARS = 8000
MAX_LINKS_PER_HUB = 8
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 1.2
MAX_COURSES_PER_RUN = 20

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
]


def domain_of(url):
    match = re.search(r"https?://(?:www\.)?([^/]+)", url)
    return match.group(1).lower() if match else ""


def is_allowed_domain(url):
    d = domain_of(url)
    return any(d == allowed or d.endswith("." + allowed) for allowed in ALLOWED_DOMAINS)


def strip_html(html):
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]*>", " ", html)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def fetch_raw_html(url):
    try:
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        res = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if not res.ok:
            return None
        return res.text
    except Exception as e:
        print("  [fetch error] " + url + ": " + str(e))
        return None


def extract_links_from_hub(hub_url, html):
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html)
    base_domain = domain_of(hub_url)
    links = []
    for href in hrefs:
        if href.startswith("//"):
            href = "https:" + href
        elif href.startswith("/"):
            href = "https://" + base_domain + href
        if not href.startswith("http"):
            continue
        if not is_allowed_domain(href):
            continue
        if href.rstrip("/") == hub_url.rstrip("/"):
            continue
        links.append(href)
    seen = set()
    unique = []
    for l in links:
        if l not in seen:
            seen.add(l)
            unique.append(l)
    return unique[:MAX_LINKS_PER_HUB]


def call_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" + GEMINI_API_KEY
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0},
    }
    for attempt in range(3):
        try:
            res = requests.post(url, json=body, timeout=REQUEST_TIMEOUT)
            if res.status_code == 429:
                print("  [gemini rate limited, waiting] attempt " + str(attempt + 1))
                time.sleep(20)
                continue
            if not res.ok:
                print("  [gemini http error] " + str(res.status_code) + ": " + res.text[:200])
                return None
            data = res.json()
            parts = data["candidates"][0]["content"]["parts"]
            return "".join(p.get("text", "") for p in parts)
        except Exception as e:
            print("  [gemini error] " + str(e))
            return None
    return None


def extract_course_from_page(page_text):
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
        "PAGE TEXT:\n" + page_text[:MAX_PAGE_CHARS]
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


def make_source_id(url):
    return hashlib.sha256(url.encode()).hexdigest()[:40]


def save_to_supabase(courses):
    if not courses:
        return []
    url = SUPABASE_URL + "/rest/v1/course_staging"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=representation",
    }
    params = {"on_conflict": "source,source_id"}
    try:
        res = requests.post(url, headers=headers, params=params, json=courses, timeout=30)
        if not res.ok:
            print("  [supabase error] " + str(res.status_code) + ": " + res.text[:300])
            return []
        return res.json()
    except Exception as e:
        print("  [supabase error] " + str(e))
        return []


def notify_telegram(new_courses):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID or not new_courses:
        return
    preview = "\n".join("• " + c["title"] + " — " + c["provider"] for c in new_courses[:5])
    more = "\n...and " + str(len(new_courses) - 5) + " more" if len(new_courses) > 5 else ""
    text = (
        "🎓 InternHunt: " + str(len(new_courses)) + " new course"
        + ("s" if len(new_courses) > 1 else "") + " waiting for approval\n\n"
        + preview + more + "\n\nCheck the admin panel to approve/reject."
    )
    try:
        requests.post(
            "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text},
            timeout=10,
        )
    except Exception as e:
        print("  [telegram error] " + str(e))


def main():
    print("Starting course fetch across " + str(len(HUB_PAGES)) + " official hub pages...")

    all_candidate_urls = set()
    for hub_url in HUB_PAGES:
        print("Visiting hub: " + hub_url)
        html = fetch_raw_html(hub_url)
        if not html:
            print("  -> could not load")
            time.sleep(SLEEP_BETWEEN_CALLS)
            continue
        links = extract_links_from_hub(hub_url, html)
        print("  -> " + str(len(links)) + " candidate course links found")
        all_candidate_urls.update(links)
        time.sleep(SLEEP_BETWEEN_CALLS)

    print("Total " + str(len(all_candidate_urls)) + " unique candidate course pages to check.")

    all_courses = []
    for url in list(all_candidate_urls)[:MAX_COURSES_PER_RUN]:
        html = fetch_raw_html(url)
        if not html:
            continue
        page_text = strip_html(html)
        if len(page_text) < 200:
            continue

        extracted = extract_course_from_page(page_text)
        if not extracted:
            continue

        extracted["domain"] = domain_of(url)
        extracted["url"] = url
        extracted["source"] = "hub-crawl"
        extracted["source_id"] = make_source_id(url)
        all_courses.append(extracted)
        time.sleep(4)

    print("Extracted " + str(len(all_courses)) + " candidate courses total.")

    newly_inserted = save_to_supabase(all_courses)
    print("Newly inserted into course_staging: " + str(len(newly_inserted)))

    if newly_inserted:
        notify_telegram(newly_inserted)
        print("Telegram notification sent.")

    print("Done.")


if __name__ == "__main__":
    main()