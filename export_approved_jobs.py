"""
InternHunt — export approved (live) jobs to an Excel file.

Pulls every row from the `jobs` table (the live, approved listings) and
writes them into approved_jobs.xlsx in the repo root. Since the `jobs`
table only ever grows (approvals are never deleted from it here), simply
regenerating the sheet from scratch each run keeps it complete and
duplicate-free with no extra bookkeeping.
"""

import os
import requests
from openpyxl import Workbook

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

OUTPUT_FILE = "approved_jobs.xlsx"

COLUMNS = ["created_at", "title", "company", "category", "stipend", "location", "link", "description"]


def fetch_all_jobs():
    url = f"{SUPABASE_URL}/rest/v1/jobs"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    params = {"select": "*", "order": "created_at.desc"}
    res = requests.get(url, headers=headers, params=params, timeout=30)
    res.raise_for_status()
    return res.json()


def main():
    jobs = fetch_all_jobs()
    print(f"Fetched {len(jobs)} approved jobs from Supabase.")

    wb = Workbook()
    ws = wb.active
    ws.title = "Approved Jobs"
    ws.append([c.replace("_", " ").title() for c in COLUMNS])

    for job in jobs:
        row = [job.get(col, "") or "" for col in COLUMNS]
        ws.append(row)

    for col_cells in ws.columns:
        max_len = max((len(str(c.value)) for c in col_cells if c.value), default=10)
        ws.column_dimensions[col_cells[0].column_letter].width = min(max_len + 2, 60)

    wb.save(OUTPUT_FILE)
    print(f"Saved {OUTPUT_FILE} with {len(jobs)} rows.")


if __name__ == "__main__":
    main()