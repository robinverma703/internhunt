"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StagedHackathon = {
  id: string;
  title: string;
  organizer: string;
  description: string;
  mode: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  prize: string | null;
  category: string;
  link: string;
  source: string;
  scraped_at: string;
  flags: string[];
};

export default function AdminHackathonReview() {
  const router = useRouter();
  const [hackathons, setHackathons] = useState<StagedHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingAll, setRejectingAll] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hackathons");
      const data = await res.json();
      setHackathons(data.hackathons ?? []);
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
      const res = await fetch("/api/admin/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setHackathons((h) => h.filter((item) => item.id !== id));
        router.refresh();
      }
    } finally {
      setActingId(null);
    }
  }

  async function rejectAll() {
    if (!confirm(`Reject all ${hackathons.length} pending hackathons? This cannot be undone.`)) {
      return;
    }
    setRejectingAll(true);
    try {
      const res = await fetch("/api/admin/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_all" }),
      });
      if (res.ok) {
        setHackathons([]);
        router.refresh();
      }
    } finally {
      setRejectingAll(false);
    }
  }

  async function approveAll() {
    if (!confirm(`Approve all ${hackathons.length} pending hackathons? They will go live immediately.`)) {
      return;
    }
    setApprovingAll(true);
    try {
      const res = await fetch("/api/admin/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_all" }),
      });
      if (res.ok) {
        setHackathons([]);
        router.refresh();
      }
    } finally {
      setApprovingAll(false);
    }
  }

  return (
    <div style={{ border: "1px solid #333", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Hackathons review queue ({hackathons.length})
          </h2>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            New hackathons found automatically. Nothing here is live until you approve it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {hackathons.length > 0 && (
            <button
              onClick={approveAll}
              disabled={approvingAll || rejectingAll}
              style={{ fontSize: 12, color: "green" }}
            >
              {approvingAll ? "Approving..." : "Approve All"}
            </button>
          )}
          {hackathons.length > 0 && (
            <button
              onClick={rejectAll}
              disabled={rejectingAll || approvingAll}
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
        {hackathons.map((h) => (
          <div key={h.id} style={{ border: "1px solid #333", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>
                  {h.title}{" "}
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    ({h.category} · {h.mode})
                  </span>
                </p>
                {h.flags && h.flags.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {h.flags.map((f, i) => (
                      <p key={i} style={{ fontSize: 11, color: "orange" }}>
                        ⚠️ {f}
                      </p>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 12, opacity: 0.7 }}>
                  {h.organizer} {h.location ? `· ${h.location}` : ""}{" "}
                  {h.prize ? `· ${h.prize}` : ""}
                </p>
                <p style={{ fontSize: 12, opacity: 0.7 }}>
                  {h.start_date ? `Starts: ${h.start_date}` : ""}
                  {h.registration_deadline ? ` · Reg. deadline: ${h.registration_deadline}` : ""}
                </p>
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {h.description.slice(0, 150)}...
                </p>
                <a href={h.link} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  View source listing
                </a>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => act(h.id, "approve")}
                  disabled={actingId === h.id}
                  style={{ color: "green" }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => act(h.id, "reject")}
                  disabled={actingId === h.id}
                  style={{ color: "red" }}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && hackathons.length === 0 && (
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            No pending hackathons. The daily fetcher will find more automatically.
          </p>
        )}
      </div>
    </div>
  );
}