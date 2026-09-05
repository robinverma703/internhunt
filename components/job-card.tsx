"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Building2, IndianRupee, MapPin, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type Job = {
  id: string;
  title: string;
  company: string;
  description: string;
  stipend: string | null;
  link: string;
  category: string;
  created_at: string;
  location?: string | null;
};

function getFreshnessBadge(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { label: "🟢 Posted Today", bg: "#dcfce7", color: "#16a34a" };
  }
  if (diffDays <= 3) {
    return { label: `🟡 ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`, bg: "#fef9c3", color: "#ca8a04" };
  }
  return null;
}

type VibeTag = { label: string; emoji: string };

function getVibeTags(job: Job): VibeTag[] {
  const text = `${job.description} ${job.title} ${job.category}`.toLowerCase();
  const tags: VibeTag[] = [];

  if (
    text.includes("remote") ||
    text.includes("work from home") ||
    text.includes("wfh")
  ) {
    tags.push({ label: "Work From Home", emoji: "💻" });
  }

  if (
    text.includes("fast-growing") ||
    text.includes("fast growing") ||
    text.includes("funded") ||
    text.includes("series a") ||
    text.includes("series b") ||
    text.includes("startup")
  ) {
    tags.push({ label: "Fast Growing Startup", emoji: "🚀" });
  }

  if (job.stipend && job.stipend.toLowerCase() !== "not disclosed") {
    tags.push({ label: "Stipend Guaranteed", emoji: "💰" });
  }

  if (
    text.includes("flexible hours") ||
    text.includes("casual") ||
    text.includes("chill") ||
    text.includes("no dress code") ||
    text.includes("flexible timing")
  ) {
    tags.push({ label: "Chill Culture", emoji: "😎" });
  }

  return tags.slice(0, 3);
}

function VibeBadge({ tag }: { tag: VibeTag }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        background: "#f1f5f9",
        color: "#334155",
        whiteSpace: "nowrap",
      }}
    >
      <span>{tag.emoji}</span>
      {tag.label}
    </span>
  );
}

function MatchBadge({ score }: { score: number }) {
  const variant = score >= 70 ? "mint" : score >= 40 ? "default" : "outline";
  const emoji = score >= 70 ? "🔥" : score >= 40 ? "✨" : "";
  return (
    <Badge variant={variant} className="shrink-0">
      {emoji} {score}% Match
    </Badge>
  );
}

export default function JobCard({ job, matchScore = null }: { job: Job; matchScore?: number | null }) {
  const [open, setOpen] = useState(false);
  const freshness = getFreshnessBadge(job.created_at);
  const vibeTags = getVibeTags(job);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <Card className="h-full hover:shadow-card-hover">
          <CardContent className="flex h-full flex-col gap-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal-dim text-signal">
                  <Building2 size={17} />
                </span>
                <div>
                  <h3 className="font-display text-[15px] font-semibold leading-tight text-graphite">
                    {job.title}
                  </h3>
                  <p className="text-xs text-muted">{job.company}</p>
                </div>
              </div>
              <Badge variant="outline">{job.category}</Badge>
            </div>

            {matchScore !== null && (
              <div>
                <MatchBadge score={matchScore} />
              </div>
            )}

            {job.location && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <MapPin size={12} />
                {job.location}
              </span>
            )}

            {freshness && (
              <span
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: freshness.bg,
                  color: freshness.color,
                }}
              >
                {freshness.label}
              </span>
            )}

            {vibeTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vibeTags.map((tag) => (
                  <VibeBadge key={tag.label} tag={tag} />
                ))}
              </div>
            )}

            <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
              {job.description}
            </p>

            <div className="flex items-center justify-between border-t border-line pt-4">
              {job.stipend ? (
                <span className="flex items-center gap-1 font-mono text-sm text-graphite">
                  <IndianRupee size={13} />
                  {job.stipend}
                </span>
              ) : (
                <span className="text-sm text-muted">Stipend not disclosed</span>
              )}
              <span
                data-cursor-hover
                className="inline-flex items-center gap-1 rounded-full bg-graphite px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-signal"
              >
                View details
                <ArrowUpRight size={13} />
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: 16,
                padding: 28,
                maxWidth: 600,
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                position: "relative",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{ position: "absolute", top: 16, right: 16 }}
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-signal-dim text-signal">
                  <Building2 size={20} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-graphite">
                    {job.title}
                  </h2>
                  <p className="text-sm text-muted">{job.company}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Badge variant="outline">{job.category}</Badge>
                {matchScore !== null && <MatchBadge score={matchScore} />}
                {job.location && (
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <MapPin size={13} />
                    {job.location}
                  </span>
                )}
                {freshness && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: freshness.bg,
                      color: freshness.color,
                    }}
                  >
                    {freshness.label}
                  </span>
                )}
                {job.stipend ? (
                  <span className="flex items-center gap-1 font-mono text-sm text-graphite">
                    <IndianRupee size={13} />
                    {job.stipend}
                  </span>
                ) : (
                  <span className="text-sm text-muted">Stipend not disclosed</span>
                )}
              </div>

              {vibeTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {vibeTags.map((tag) => (
                    <VibeBadge key={tag.label} tag={tag} />
                  ))}
                </div>
              )}

              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-graphite">
                {job.description}
              </p>

              <a href={job.link} target="_blank" rel="noopener noreferrer" data-cursor-hover className="mt-6 inline-flex items-center gap-2 rounded-full bg-graphite px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-signal">
                Apply Now
                <ArrowUpRight size={15} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}