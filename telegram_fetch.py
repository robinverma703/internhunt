"""
InternHunt — Telegram channel job fetcher.

Reads recent messages from a public Telegram channel, asks Gemini to
extract any job/internship postings from each message, and saves
structured results into the same `job_staging` table used by the
rest of the pipeline (so they show up in the admin review queue).
Also sends a Telegram notification when new jobs are found.
"""

import os
import re
import json
import hashlib
import requests
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TELEGRAM_API_ID = int(os.environ["TELEGRAM_API_ID"])
TELEGRAM_API_HASH = os.environ["TELEGRAM_API_HASH"]
TELEGRAM_SESSION_STRING = os.environ["TELEGRAM_SESSION_STRING"]
SOURCE_CHANNEL = os.environ.get("TELEGRAM_SOURCE_CHANNEL", "@jobs_and_internships_updates")

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

MESSAGES_PER_RUN = 20
REQUEST_TIMEOUT = 15


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


def extract_jobs_from_message(message_text: str):
    prompt = (
        "This text is one message from a Telegram channel that posts "
        "job/internship openings. It may contain ONE posting, MULTIPLE "
        "postings, or NO posting at all (e.g. just a greeting, an ad, "
        "or unrelated chatter).\n\n"
        "Extract every distinct job/internship posting you find. For "
        "each one, give: title, company name (if mentioned, else null), "
        "a direct application link if visible (else null), and location "
        "if mentioned (else null).\n\n"
        'Respond with ONLY a JSON array, no markdown, no explanation:\n'
        '[{"title":"...","company":"..." or null,"link":"..." or null,"location":"..." or null}]\n'
        "If there is no real posting in this message, respond with exactly: []\n\n"
        f"MESSAGE:\n{message_text[:3000]}"
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
                    "link": j.get("link"),
                    "location": j.get("location"),
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
    for pattern, category in CATEGORY_RULES:
        if re.search(pattern, t):
            return category
    return "General"


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
        res = requests.post(url, headers=headers, params=params, json=jobs, timeout=30)
        if not res.ok:
            print(f"  [supabase error] {res.status_code}: {res.text[:300]}")
            return []
        return res.json()
    except Exception as e:
        print(f"  [supabase error] {e}")
        return []


def notify_telegram(jobs: list):
    if not jobs or not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return

    lines = [f"🟢 InternHunt: {len(jobs)} new job(s) from Telegram channel"]
    lines.append("")
    for j in jobs[:10]:
        lines.append(f"• {j['title']} — {j['company']}")
    if len(jobs) > 10:
        lines.append(f"...and {len(jobs) - 10} more")
    lines.append("")
    lines.append("Check the admin panel to approve/reject.")
    text = "\n".join(lines)

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": text}, timeout=10)
    except Exception as e:
        print(f"  [telegram notify error] {e}")


def main():
    print(f"Connecting to Telegram, reading last {MESSAGES_PER_RUN} messages from {SOURCE_CHANNEL}...")

    all_jobs = []
    with TelegramClient(StringSession(TELEGRAM_SESSION_STRING), TELEGRAM_API_ID, TELEGRAM_API_HASH) as client:
        for message in client.iter_messages(SOURCE_CHANNEL, limit=MESSAGES_PER_RUN):
            if not message.text:
                continue

            extracted = extract_jobs_from_message(message.text)
            for job in extracted:
                source_id = f"telegram-{message.id}-{hashlib.sha256(job['title'].encode()).hexdigest()[:8]}"
                job["description"] = f"Found via Telegram channel {SOURCE_CHANNEL}. Verify details before approving."
                job["stipend"] = None
                job["category"] = guess_category(job["title"])
                job["source"] = "telegram"
                job["source_id"] = source_id
                job["flags"] = ["Auto-discovered via Telegram channel — verify carefully before approving"]
                if not job.get("link"):
                    job["link"] = f"https://t.me/{SOURCE_CHANNEL.lstrip('@')}/{message.id}"
                all_jobs.append(job)

    print(f"Extracted {len(all_jobs)} candidate jobs total.")

    newly_inserted = save_to_supabase(all_jobs)
    print(f"Newly inserted into job_staging: {len(newly_inserted)}")

    if newly_inserted:
        notify_telegram(newly_inserted)
        print("Telegram notification sent.")

    print("Done.")


if __name__ == "__main__":
    main()