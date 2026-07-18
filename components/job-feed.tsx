"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import JobCard, { type Job } from "@/components/job-card";
import { cn } from "@/lib/utils";

export default function JobFeed({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(jobs.map((j) => j.category)))],
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesCategory = category === "All" || j.category === category;
      const matchesQuery =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [jobs, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by role or company…"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              data-cursor-hover
              onClick={() => setCategory(c)}
              className="focus-visible:outline-none"
            >
              <Badge
                variant={category === c ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  category === c && "bg-signal text-white"
                )}
              >
                {c}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
      </p>

      <motion.div
        layout
        className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((job) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-graphite">No listings match that search.</p>
          <p className="text-sm text-muted">Try a different role, company, or category.</p>
        </div>
      )}
    </div>
  );
}
