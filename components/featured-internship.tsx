"use client";

import { Building2, IndianRupee, ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/components/job-card";

export default function FeaturedInternship({ job }: { job: Job }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center justify-center gap-2"
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <Sparkles size={12} className="text-white" />
        </span>
        <span
          className="text-xs font-bold uppercase tracking-[0.15em]"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Internship of the Week
        </span>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <Sparkles size={12} className="text-white" />
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ y: -4 }}
        style={{
          position: "relative",
          borderRadius: 24,
          padding: 1.5,
          background: "linear-gradient(135deg, #6366f1, #a855f7, #6366f1)",
          boxShadow: "0 25px 60px -15px rgba(99,102,241,0.4)",
        }}
      >
        <div
          style={{
            borderRadius: 22.5,
            background: "linear-gradient(180deg, #ffffff, #fafaff)",
            padding: "48px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* subtle glow blob */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #eef2ff, #ede9fe)",
              boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.15), 0 8px 20px -8px rgba(99,102,241,0.3)",
            }}
          >
            <Building2 size={26} className="text-signal" />
          </span>

          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-graphite">
              {job.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted">{job.company}</p>
          </div>

          <Badge variant="outline" className="border-line/80 text-[11px]">
            {job.category}
          </Badge>

          {job.stipend && (
            <span className="flex items-center gap-1.5 font-mono text-xl font-semibold text-graphite">
              <IndianRupee size={18} />
              {job.stipend}
            </span>
          )}

          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-hover
            className="mt-3 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              boxShadow: "0 10px 25px -8px rgba(15,23,42,0.5)",
            }}
          >
            Apply Now
            <ArrowUpRight size={15} />
          </a>
        </div>
      </motion.div>
    </section>
  );
}