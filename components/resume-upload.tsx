"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, X, Loader2, RefreshCw, ArrowUpRight, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateMatchScore } from "@/lib/match-score";
import type { Job } from "@/components/job-card";

interface ResumeUploadProps {
  initialFilename?: string | null;
  initialSkills?: string[];
  initialSummary?: string | null;
  jobs?: Job[];
}

function SkillRing({ count }: { count: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(count / 20, 1);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - animated)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tracking-tight text-graphite">{count}</span>
        <span className="text-[11px] text-muted">skills found</span>
      </div>
    </div>
  );
}

export default function ResumeUpload(props: ResumeUploadProps) {
  const initialFilename = props.initialFilename;
  const initialSkills = props.initialSkills ?? [];
  const initialSummary = props.initialSummary;
  const jobs = props.jobs ?? [];

  const [filename, setFilename] = useState<string | null>(initialFilename ?? null);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [summary, setSummary] = useState<string | null>(initialSummary ?? null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasResume = Boolean(filename) && status !== "error";

  const topMatch = useMemo(() => {
    if (!hasResume || skills.length === 0 || jobs.length === 0) return null;
    let bestJob: Job | null = null;
    let bestScore = 0;
    for (const job of jobs) {
      const result = calculateMatchScore(skills, {
        title: job.title,
        description: job.description,
        category: job.category,
      });
      if (result.score > bestScore) {
        bestScore = result.score;
        bestJob = job;
      }
    }
    if (!bestJob || bestScore === 0) return null;
    return { job: bestJob, score: bestScore };
  }, [hasResume, skills, jobs]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setErrorMsg("Only PDF files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("File is larger than 5MB.");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong.");
        return;
      }

      setFilename(file.name);
      setSkills(data.skills ?? []);
      setSummary(data.summary ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again.");
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <Card className="relative mb-8 overflow-hidden border-line/70">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <AnimatePresence mode="wait">
        {status === "uploading" ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
          >
            <Loader2 size={30} className="animate-spin text-signal" />
            <p className="text-sm font-medium text-graphite">Reading your resume and matching it to jobs…</p>
            <p className="text-xs text-muted">Usually takes 10–15 seconds</p>
          </motion.div>
        ) : hasResume ? (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-signal/10 blur-3xl" />
            <CardContent className="relative pt-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <SkillRing count={skills.length} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-graphite">Your match profile is live</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <FileText size={12} />
                    {filename}
                    <button
                      data-cursor-hover
                      onClick={() => inputRef.current?.click()}
                      className="ml-2 inline-flex items-center gap-1 text-signal hover:underline"
                    >
                      <RefreshCw size={11} />
                      Replace
                    </button>
                  </p>
                  {summary ? (
                    <p className="mt-3 line-clamp-2 text-sm italic leading-relaxed text-muted">{summary}</p>
                  ) : null}
                </div>
              </div>

              {skills.length > 0 ? (
                <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="mint" className="shrink-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {topMatch ? (
                <a
                  href={topMatch.job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor-hover
                  className="mt-6 flex items-center gap-4 rounded-xl border border-line bg-gradient-to-r from-signal-dim/60 to-mint-dim/40 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-signal shadow-sm">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-signal">Your top match</p>
                    <p className="truncate text-sm font-semibold text-graphite">{topMatch.job.title}</p>
                    <p className="truncate text-xs text-muted">{topMatch.job.company}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="mint">{topMatch.score}% Match</Badge>
                    <ArrowUpRight size={16} className="text-muted" />
                  </div>
                </a>
              ) : null}
            </CardContent>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CardContent className="pt-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                data-cursor-hover
                className={
                  dragActive
                    ? "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-signal bg-signal-dim px-6 py-14 text-center transition-colors duration-200"
                    : "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line px-6 py-14 text-center transition-colors duration-200 hover:border-signal/60 hover:bg-signal-dim/30"
                }
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-signal-dim">
                  <Upload size={24} className="text-signal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-graphite">See your match score for every listing</p>
                  <p className="mt-1 text-xs text-muted">Drop your resume here, or click to browse — PDF, up to 5MB</p>
                </div>
              </div>

              {status === "error" ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  <X size={14} />
                  {errorMsg}
                </div>
              ) : null}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}