"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Deloitte", "TCS", "Infosys",
  "Adobe", "Flipkart", "Zomato", "Swiggy", "PwC", "EY",
  "Accenture", "Wipro", "Paytm", "JPMorgan",
];

const DIRECTIONS = [
  { x: -80, y: -40 },
  { x: 80, y: -40 },
  { x: -80, y: 40 },
  { x: 80, y: 40 },
];

const SLOT_COUNT = 4;
const INTERVAL_MS = 2200;
const STAGGER_MS = 550;

function useRotatingWord(offset: number) {
  const [index, setIndex] = useState(offset);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const id = setInterval(() => {
        setIndex((i) => (i + SLOT_COUNT) % COMPANIES.length);
      }, INTERVAL_MS);
      return () => clearInterval(id);
    }, offset * STAGGER_MS);
    return () => clearTimeout(timeout);
  }, [offset]);

  return COMPANIES[index % COMPANIES.length];
}

function Slot({ slotIndex }: { slotIndex: number }) {
  const word = useRotatingWord(slotIndex);
  const dir = DIRECTIONS[slotIndex % DIRECTIONS.length];

  return (
    <div className="flex h-16 items-center justify-center md:h-20">
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          initial={{ opacity: 0, x: dir.x, y: dir.y, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="select-none whitespace-nowrap font-display text-2xl font-extrabold tracking-tight text-graphite/70 md:text-4xl"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function FloatingCompanies() {
  return (
    <section className="relative overflow-hidden py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
        Where our users land internships
      </p>

      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-4 px-6 md:grid-cols-4">
        {Array.from({ length: SLOT_COUNT }).map((_, i) => (
          <Slot key={i} slotIndex={i} />
        ))}
      </div>
    </section>
  );
}