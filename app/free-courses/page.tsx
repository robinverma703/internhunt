"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Search,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const EASE = [0.22, 1, 0.36, 1] as const;

type Course = {
  title: string;
  provider: string;
  domain: string;
  url: string;
  category: string;
  duration: string;
  certFree: boolean;
  verified: string;
};

const COURSES: Course[] = [
  {
    title: "Cloud Digital Leader",
    provider: "Google Cloud Skills Boost",
    domain: "cloudskillsboost.google",
    url: "https://www.cloudskillsboost.google/",
    category: "Cloud",
    duration: "8-10 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Fundamentals of Digital Marketing",
    provider: "Google Digital Garage",
    domain: "learndigital.withgoogle.com",
    url: "https://learndigital.withgoogle.com/digitalgarage",
    category: "Marketing",
    duration: "40 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Azure Fundamentals (AZ-900 path)",
    provider: "Microsoft Learn",
    domain: "learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/",
    category: "Cloud",
    duration: "6-8 hrs",
    certFree: false,
    verified: "Sep 2026",
  },
  {
    title: "AWS Cloud Practitioner Essentials",
    provider: "AWS Skill Builder",
    domain: "aws.amazon.com",
    url: "https://aws.amazon.com/training/learn-about/cloud-practitioner/",
    category: "Cloud",
    duration: "6 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Fundamentals of Deep Learning",
    provider: "NVIDIA Deep Learning Institute",
    domain: "nvidia.com",
    url: "https://www.nvidia.com/en-in/training/online/",
    category: "AI/ML",
    duration: "8 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Data Science Foundations",
    provider: "IBM SkillsBuild",
    domain: "skillsbuild.org",
    url: "https://skillsbuild.org/students/course-catalog/data-science",
    category: "Data",
    duration: "10 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Responsive Web Design",
    provider: "freeCodeCamp",
    domain: "freecodecamp.org",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    category: "Web Dev",
    duration: "300 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Inbound Marketing",
    provider: "HubSpot Academy",
    domain: "academy.hubspot.com",
    url: "https://academy.hubspot.com/courses/inbound-marketing",
    category: "Marketing",
    duration: "3 hrs",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Java Programming",
    provider: "Infosys Springboard",
    domain: "infyspringboard.onwingspan.com",
    url: "https://infyspringboard.onwingspan.com/web/en/page/home",
    category: "Web Dev",
    duration: "Self-paced",
    certFree: true,
    verified: "Sep 2026",
  },
  {
    title: "Python for Beginners",
    provider: "Microsoft Learn",
    domain: "learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/shows/intro-to-python-development/",
    category: "Web Dev",
    duration: "5 hrs",
    certFree: false,
    verified: "Sep 2026",
  },
];

const CATEGORIES = ["All", "Cloud", "AI/ML", "Web Dev", "Data", "Marketing"];

export default function FreeCoursesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      const matchesCategory = category === "All" || c.category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <main className="relative isolate min-h-screen bg-paper">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 top-24 h-[380px] w-[380px] rounded-full bg-signal/20 blur-[110px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-96 h-[340px] w-[340px] rounded-full bg-mint/20 blur-[110px]"
        />
      </div>

      <Navbar />

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-graphite shadow-sm backdrop-blur">
            <ShieldCheck size={13} className="text-mint" />
            Verified genuinely free &middot; No third-party links
          </span>

          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-graphite md:text-5xl">
            Free certificates.{" "}
            <span className="bg-gradient-to-r from-signal to-mint bg-clip-text text-transparent">
              Straight from the source.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
            Every course here is checked by hand. Every link goes straight to
            the company&apos;s own site — Google, Microsoft, AWS, NVIDIA and more.
            No redirects, no middlemen.
          </p>
        </motion.div>

        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
          className="mx-auto mt-10 flex max-w-2xl flex-col gap-4"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses or providers..."
              className="h-12 w-full rounded-full border border-line bg-white/85 pl-11 pr-4 text-[15px] text-graphite shadow-sm outline-none backdrop-blur transition-all focus:border-signal focus:shadow-[0_0_0_4px_rgba(42,76,255,0.10)]"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="relative rounded-full px-4 py-1.5 text-sm transition-colors"
                >
                  {active && (
                    <motion.span
                      layoutId="course-cat-active"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-signal to-signal-deep shadow-md shadow-signal/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className={"relative " + (active ? "text-white" : "text-muted hover:text-graphite")}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Grid */}
        <motion.div
          layout
          className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((course, i) => (
              <motion.a
                key={course.title + course.provider}
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/85 p-5 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.18)] backdrop-blur transition-shadow hover:shadow-[0_20px_45px_-16px_rgba(15,23,42,0.3)]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-signal/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signal to-signal-deep text-base font-semibold text-white">
                    {course.provider.charAt(0)}
                  </span>
                  <ArrowUpRight
                    size={17}
                    className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
                  />
                </div>

                <p className="mt-4 text-[15px] font-semibold leading-snug text-graphite">
                  {course.title}
                </p>
                <p className="mt-0.5 text-sm text-muted">{course.provider}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium " +
                      (course.certFree
                        ? "bg-mint/15 text-mint-deep"
                        : "bg-amber-100 text-amber-700")
                    }
                  >
                    <BadgeCheck size={12} />
                    {course.certFree ? "Free certificate" : "Free course · paid certificate"}
                  </span>
                  <span className="text-muted">{course.duration}</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <ExternalLink size={11} />
                    {course.domain}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={11} className="text-mint" />
                    Verified {course.verified}
                  </span>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="mt-14 text-center text-sm text-muted">
            No courses match that search. Try a different keyword or category.
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mt-16 max-w-lg rounded-2xl border border-black/5 bg-white/80 p-6 text-center shadow-sm backdrop-blur"
        >
          <p className="text-sm font-medium text-graphite">
            Know a genuinely free certification we&apos;re missing?
          </p>
          <p className="mt-1 text-sm text-muted">
            Tell us the official link — no aggregators, no affiliate pages.
          </p>
          <a
            href="/post-job"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-graphite px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
          >
            Suggest a course <ArrowUpRight size={14} />
          </a>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}