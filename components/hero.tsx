"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITLES = [
  "Product Design Intern — Figma-first team",
  "SDE Intern, Backend — Node / Postgres",
  "Growth Marketing Intern — D2C brand",
  "Data Analyst Intern — SQL + Python",
  "Founder's Office Intern — early-stage startup",
  "UI/UX Intern — fintech app",
  "ML Intern — computer vision team",
  "Content & Social Intern — B2B SaaS",
];

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Swiggy", "Flipkart",
  "Zomato", "Adobe", "TCS", "Infosys", "Deloitte",
];

export default function Hero() {
  const loop = [...TITLES, ...TITLES];

  // Row A: normal order
  const companiesLoopA = [...COMPANIES, ...COMPANIES];

  // Row B: same companies but rotated, so it never shows the same
  // company at the same position/time as Row A.
  const ROTATE_BY = 5;
  const rotatedCompanies = [
    ...COMPANIES.slice(ROTATE_BY),
    ...COMPANIES.slice(0, ROTATE_BY),
  ];
  const companiesLoopB = [...rotatedCompanies, ...rotatedCompanies];

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-40 h-64 w-64 rounded-full bg-mint/25 blur-3xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute z-0 overflow-hidden"
        style={{ top: "16%", left: 0, width: "50%" }}
      >
        <div className="company-track-left flex w-max items-center whitespace-nowrap">
          {companiesLoopA.map((name, i) => (
            <span
              key={`a-${i}`}
              className="mx-[20vw] select-none font-display text-5xl font-black tracking-tighter text-graphite/10 md:text-7xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute z-0 overflow-hidden"
        style={{ top: "68%", left: 0, width: "50%" }}
      >
        <div className="company-track-right flex w-max items-center whitespace-nowrap">
          {companiesLoopB.map((name, i) => (
            <span
              key={`b-${i}`}
              className="mx-[20vw] select-none font-display text-5xl font-black tracking-tighter text-graphite/10 md:text-7xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 text-5xl select-none"
        style={{ top: "6%", left: "2%" }}
        initial={{ x: -300, y: 200, opacity: 0, rotate: -60 }}
        animate={{
          x: 0,
          y: [0, -16, 0],
          opacity: 1,
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          x: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.5 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
        }}
      >
        🚀
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 text-3xl select-none"
        style={{ top: "12%", left: "42%" }}
        initial={{ y: -250, opacity: 0, rotate: 90 }}
        animate={{ y: [0, -16, 0], opacity: 1, rotate: [0, 10, -10, 0] }}
        transition={{
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          opacity: { duration: 0.5, delay: 0.4 },
          rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
        }}
      >
        ✨
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 text-4xl select-none"
        style={{ top: "62%", left: "1%" }}
        initial={{ x: -300, opacity: 0, rotate: -45 }}
        animate={{ x: 0, y: [0, -16, 0], opacity: 1, rotate: [0, 10, -10, 0] }}
        transition={{
          x: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
          opacity: { duration: 0.5, delay: 0.3 },
          y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
          rotate: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
        }}
      >
        💼
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 text-4xl select-none"
        style={{ top: "78%", left: "38%" }}
        initial={{ y: 250, opacity: 0, rotate: -90 }}
        animate={{ y: [0, -16, 0], opacity: 1, rotate: [0, 10, -10, 0] }}
        transition={{
          y: { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
          opacity: { duration: 0.5, delay: 0.6 },
          rotate: { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
        }}
      >
        🎯
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 text-4xl select-none"
        style={{ top: "4%", left: "88%" }}
        initial={{ x: 300, y: -200, opacity: 0, rotate: 60 }}
        animate={{ x: 0, y: [0, -16, 0], opacity: 1, rotate: [0, 10, -10, 0] }}
        transition={{
          x: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 },
          opacity: { duration: 0.5, delay: 0.2 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.1 },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.1 },
        }}
      >
        🔥
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 text-3xl select-none"
        style={{ top: "85%", left: "8%" }}
        initial={{ x: -250, opacity: 0, rotate: -60 }}
        animate={{ x: 0, y: [0, -16, 0], opacity: 1, rotate: [0, 10, -10, 0] }}
        transition={{
          x: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.6 },
          opacity: { duration: 0.5, delay: 0.6 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
          rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
        }}
      >
        ⭐
      </motion.div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:pb-32 md:pt-24">
        <div className="relative z-20">
          <motion.span
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-signal-dim px-3 py-1 text-xs font-medium text-signal-deep shadow-sm"
          >
            🎉 New listings verified daily
          </motion.span>

          <h1 className="mt-6 text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-graphite md:text-6xl">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              One feed.
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              Every real
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative inline-block"
            >
              internship.
              <motion.svg
                aria-hidden
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
              >
                <motion.path
                  d="M2 9 Q 50 2 100 8 T 198 6"
                  stroke="#0FB37D"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </motion.svg>
            </motion.div>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 max-w-md text-lg text-muted"
          >
            InternHunt filters thousands of postings down to the ones worth your time —
            checked by hand, delivered live, no dead links.
          </motion.p>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.75 }}
            className="mt-9 flex items-center gap-4"
          >
            <Link href="/login" data-cursor-hover>
              <motion.div
                whileHover={{ scale: 1.08, rotate: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 350, damping: 10 }}
              >
                <Button variant="signal" size="lg" className="group shadow-lg">
                  Get started
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </motion.div>
            </Link>
            <span className="text-sm text-muted">₹99 · lifetime access</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 80, rotate: 3 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 h-[420px] overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
        >
          <div
            className="marquee-track flex flex-col gap-3 p-5"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0, black 100px, black calc(100% - 100px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0, black 100px, black calc(100% - 100px), transparent 100%)",
            }}
          >
            {loop.map(function (title, i) {
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03, x: 6 }}
                  className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-graphite"
                >
                  <span className="h-2 w-2 shrink-0 animate-pulse-dot rounded-full bg-mint" />
                  {title}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes company-scroll-left {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes company-scroll-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0%);
          }
        }
        .company-track-left {
          animation: company-scroll-left 50s linear infinite;
        }
        .company-track-right {
          animation: company-scroll-right 50s linear infinite;
        }
      `}</style>
    </section>
  );
}