"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Deloitte", "TCS", "Infosys",
  "Adobe", "Flipkart", "Zomato", "Swiggy", "PwC", "EY",
  "Accenture", "Wipro", "Paytm", "JPMorgan",
];

const DIRECTIONS = [
  { x: -260, y: 0 },
  { x: 260, y: 0 },
  { x: 0, y: -160 },
  { x: 0, y: 160 },
];

export default function FloatingCompanies() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % COMPANIES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const dir = DIRECTIONS[index % DIRECTIONS.length];

  return (
    <section className="relative overflow-hidden py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
        Where our users land internships
      </p>

      <div className="relative mt-8 flex h-24 items-center justify-center md:h-32">
        <AnimatePresence mode="wait">
          <motion.span
            key={COMPANIES[index]}
            initial={{ opacity: 0, x: dir.x, y: dir.y, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="select-none font-display text-4xl font-bold tracking-tight text-graphite/15 md:text-6xl"
          >
            {COMPANIES[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </section>
  );
}