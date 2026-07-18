"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Building2, IndianRupee } from "lucide-react";
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
};

export default function JobCard({ job }: { job: Job }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
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
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="inline-flex items-center gap-1 rounded-full bg-graphite px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-signal"
            >
              Apply
              <ArrowUpRight size={13} />
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
