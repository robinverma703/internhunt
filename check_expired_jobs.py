"""
InternHunt — Expired job link cleaner.
Checks every live job's link; removes jobs whose links are dead, 404, or
show "no longer available" style messages (common on Workday-style portals).
"""

import os
import re
import time
import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 0.8

DEAD_PHRASES = [
    "no longer accepting applications",
    "this job is no longer available",
    "position has been filled",
    "job not found",
    "job posting not found",
    "this requisition is no longer active",
    "page not found",
    "404 error",
    "this posting is closed",
    "job is closed",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}


def fetch_all_live_jobs():
    url = f"{SUPABASE_URL}/rest/v1/jobs"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    params = {"select": "id,title,company,link"}
    try:
        res = requests.get(url, headers=headers, params=params, timeout=30)
        if not res.ok:
            print(f"  [fetch jobs error] {res.status_code}: {res.text[:200]}")
            return []
        return res.json()
    except Exception as e:
        print(f"  [fetch jobs error] {e}")
        return []


def is_link_dead(link: str) -> bool:
    try:
        res = requests.get(link, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        if res.status_code in (404, 410):
            return True
        if res.status_code >= 400:
            return False  # some portals block bots with 403; don't delete on that alone
        text = res.text.lower()
        for phrase in DEAD_PHRASES:
            if phrase in text:
                return True
        return False
    except Exception:
        return False  # network hiccup; don't delete, try again next run


def delete_job(job_id: str):
    url = f"{SUPABASE_URL}/rest/v1/jobs"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    params = {"id": f"eq.{job_id}"}
    try:
        res = requests.delete(url, headers=headers, params=params, timeout=15)
        return res.ok
    except Exception as e:
        print(f"  [delete error] {e}")
        return False


def main():
    jobs = fetch_all_live_jobs()
    print(f"Checking {len(jobs)} live jobs for dead links...")

    removed = 0
    for job in jobs:
        link = job.get("link")
        if not link:
            continue

        dead = is_link_dead(link)
        if dead:
            ok = delete_job(job["id"])
            if ok:
                removed += 1
                print(f"  Removed (dead link): {job.get('title')} — {job.get('company')}")
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"Done. Removed {removed} expired job(s) out of {len(jobs)} checked.")


if __name__ == "__main__":
    main()