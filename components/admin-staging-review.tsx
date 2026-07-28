"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StagedJob = {
  id: string;
  title: string;
  company: string;
  description: string;
  stipend: string | null;
  link: string;
  category: string;
  source: string;
  scraped_at: string;
  flags: string[];
};

export default function AdminStagingReview() {
  const router = useRouter();
  const [jobs, setJobs] = useState<StagedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingAll, setRejectingAll] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staging");
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setActingId(id);
    try {
      const res = await fetch("/api/admin/staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setJobs((j) => j.filter((job) => job.id !== id));
        router.refresh();
      }
    } finally {
      setActingId(null);
    }
  }

  async function rejectAll() {
    if (!confirm(`Reject all ${jobs.length} pending jobs? This cannot be undone.`)) {
      return;
    }
    setRejectingAll(true);
    try {
      const res = await fetch("/api/admin/staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_all" }),
      });
      if (res.ok) {
        setJobs([]);
        router.refresh();
      }
    } finally {
      setRejectingAll(false);
    }
  }

  return (
    <div style={{ border: "1px solid #333", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            AI Agent review queue ({jobs.length})
          </h2>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            New jobs found by the agent. Nothing here is live until you approve it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {jobs.length > 0 && (
            <button
              onClick={rejectAll}
              disabled={rejectingAll}
              style={{ fontSize: 12, color: "red" }}
            >
              {rejectingAll ? "Rejecting..." : "Reject All"}
            </button>
          )}
          <button onClick={load} style={{ fontSize: 12 }}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {jobs.map((job) => (
          <div key={job.id} style={{ border: "1px solid #333", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>
                  {job.title} <span style={{ fontSize: 11, opacity: 0.6 }}>({job.source})</span>
                </p>
                {job.flags && job.flags.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {job.flags.map((f, i) => (
                      <p key={i} style={{ fontSize: 11, color: "orange" }}>
                        ⚠️ {f}
                      </p>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 12, opacity: 0.7 }}>
                  {job.company} {job.stipend ? `· ${job.stipend}` : ""}
                </p>
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {job.description.slice(0, 150)}...
                </p>
                <a href={job.link} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  View source listing
                </a>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => act(job.id, "approve")}
                  disabled={actingId === job.id}
                  style={{ color: "green" }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => act(job.id, "reject")}
                  disabled={actingId === job.id}
                  style={{ color: "red" }}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && jobs.length === 0 && (
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            No pending jobs. Run <code>npm run scrape</code> to fetch new ones.
          </p>
        )}
      </div>
    </div>
  );
}