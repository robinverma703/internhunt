"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StagedCourse = {
  id: string;
  title: string;
  provider: string;
  domain: string;
  url: string;
  category: string;
  duration: string | null;
  cert_free: boolean;
  source: string;
  scraped_at: string;
};

export default function AdminCourseStagingReview() {
  const router = useRouter();
  const [courses, setCourses] = useState<StagedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingAll, setRejectingAll] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/course-staging");
      const data = await res.json();
      setCourses(data.courses ?? []);
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
      const res = await fetch("/api/admin/course-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setCourses((c) => c.filter((course) => course.id !== id));
        router.refresh();
      }
    } finally {
      setActingId(null);
    }
  }

  async function rejectAll() {
    if (!confirm(`Reject all ${courses.length} pending courses? This cannot be undone.`)) return;
    setRejectingAll(true);
    try {
      const res = await fetch("/api/admin/course-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_all" }),
      });
      if (res.ok) {
        setCourses([]);
        router.refresh();
      }
    } finally {
      setRejectingAll(false);
    }
  }

  async function approveAll() {
    if (!confirm(`Approve all ${courses.length} pending courses? They will go live immediately.`)) return;
    setApprovingAll(true);
    try {
      const res = await fetch("/api/admin/course-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_all" }),
      });
      if (res.ok) {
        setCourses([]);
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
            Course review queue ({courses.length})
          </h2>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            New free-certificate courses. Nothing here is live until you approve it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {courses.length > 0 && (
            <button onClick={approveAll} disabled={approvingAll || rejectingAll} style={{ fontSize: 12, color: "green" }}>
              {approvingAll ? "Approving..." : "Approve All"}
            </button>
          )}
          {courses.length > 0 && (
            <button onClick={rejectAll} disabled={approvingAll || rejectingAll} style={{ fontSize: 12, color: "crimson" }}>
              {rejectingAll ? "Rejecting..." : "Reject All"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, marginTop: 12 }}>Loading...</p>
      ) : courses.length === 0 ? (
        <p style={{ fontSize: 13, marginTop: 12, opacity: 0.6 }}>No courses pending review.</p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {courses.map((course) => (
            <div key={course.id} style={{ border: "1px solid #333", borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{course.title}</p>
              <p style={{ fontSize: 13, opacity: 0.7 }}>{course.provider} · {course.domain}</p>
              <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                {course.category} · {course.duration ?? "duration unknown"} ·{" "}
                {course.cert_free ? "Free certificate" : "Free course, paid certificate"}
              </p>
              <a href={course.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#3d5afe" }}>
                {course.url}
              </a>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => act(course.id, "approve")}
                  disabled={actingId === course.id}
                  style={{ fontSize: 12, color: "green" }}
                >
                  Approve
                </button>
                <button
                  onClick={() => act(course.id, "reject")}
                  disabled={actingId === course.id}
                  style={{ fontSize: 12, color: "crimson" }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}