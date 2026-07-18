"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Star, Briefcase, Users, Award, Clock } from "lucide-react";

const STATS = [
  { number: "500+", label: "Verified internships", icon: Briefcase },
  { number: "1,200+", label: "Students placed", icon: Users },
  { number: "4.8/5", label: "Average rating", icon: Award },
  { number: "24hr", label: "Listing turnaround", icon: Clock },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Design Intern at a D2C brand",
    quote:
      "Every other job board was full of expired links. InternHunt was the first one where every single listing actually worked.",
  },
  {
    name: "Arjun M.",
    role: "SDE Intern, backend",
    quote:
      "Paid the 99 rupees expecting nothing special. Got three real interviews in two weeks. Worth it.",
  },
  {
    name: "Kavya R.",
    role: "Growth Intern",
    quote:
      "The filtering by stipend and category actually saved me hours compared to scrolling LinkedIn.",
  },
];

const FAQS = [
  {
    q: "Is the 99 rupees a one-time payment or a subscription?",
    a: "One-time. You pay once and get lifetime access to the full feed, no recurring charges.",
  },
  {
    q: "How often are new internships added?",
    a: "New listings are added continuously throughout the week, and every single one is manually checked before it goes live.",
  },
  {
    q: "What if a link turns out to be broken?",
    a: "Message us on WhatsApp or Telegram and we will pull it down and refund your access if it happens repeatedly.",
  },
  {
    q: "Do you support students outside India?",
    a: "Right now the feed is focused on India-based and remote internships, with more regions planned soon.",
  },
];

export function StatsBar() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-gradient-to-b from-surface to-paper">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-16 md:grid-cols-4 md:gap-0 md:divide-x md:divide-line">
        {STATS.map(function (stat, i) {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center px-4 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-dim text-signal">
                <Icon size={22} />
              </div>
              <div className="mt-4 font-display text-3xl font-semibold tracking-tight text-graphite md:text-4xl">
                {stat.number}
              </div>
              <div className="mt-1 text-sm text-muted">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-2xl font-semibold tracking-tight text-graphite md:text-3xl">
        What students are saying
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map(function (t, i) {
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card"
            >
              <div className="flex gap-1 text-signal">
                {[1, 2, 3, 4, 5].map(function (n) {
                  return <Star key={n} size={14} fill="currentColor" />;
                })}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-graphite">
                {t.quote}
              </p>
              <div className="mt-5 border-t border-line pt-4">
                <div className="text-sm font-semibold text-graphite">{t.name}</div>
                <div className="text-xs text-muted">{t.role}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-2xl font-semibold tracking-tight text-graphite md:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
        {FAQS.map(function (item, i) {
          const isOpen = openIndex === i;
          return (
            <div key={item.q}>
              <button
                onClick={function () {
                  setOpenIndex(isOpen ? null : i);
                }}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-medium text-graphite">{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} className="text-muted" />
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                  {item.a}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}