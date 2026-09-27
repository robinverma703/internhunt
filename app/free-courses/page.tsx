"use client";

import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Search,
  ShieldCheck,
  ExternalLink,
  Award,
  GraduationCap,
  Sparkles,
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
  { title: "Cloud Digital Leader", provider: "Google Cloud Skills Boost", domain: "cloudskillsboost.google", url: "https://www.cloudskillsboost.google/", category: "Cloud", duration: "8-10 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Fundamentals of Digital Marketing", provider: "Google Digital Garage", domain: "learndigital.withgoogle.com", url: "https://learndigital.withgoogle.com/digitalgarage", category: "Marketing", duration: "40 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Azure Fundamentals (AZ-900 path)", provider: "Microsoft Learn", domain: "learn.microsoft.com", url: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/", category: "Cloud", duration: "6-8 hrs", certFree: false, verified: "Sep 2026" },
  { title: "AWS Cloud Practitioner Essentials", provider: "AWS Skill Builder", domain: "aws.amazon.com", url: "https://aws.amazon.com/training/learn-about/cloud-practitioner/", category: "Cloud", duration: "6 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Fundamentals of Deep Learning", provider: "NVIDIA Deep Learning Institute", domain: "nvidia.com", url: "https://www.nvidia.com/en-in/training/online/", category: "AI/ML", duration: "8 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Data Science Foundations", provider: "IBM SkillsBuild", domain: "skillsbuild.org", url: "https://skillsbuild.org/students/course-catalog/data-science", category: "Data", duration: "10 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Responsive Web Design", provider: "freeCodeCamp", domain: "freecodecamp.org", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", category: "Web Dev", duration: "300 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Inbound Marketing", provider: "HubSpot Academy", domain: "academy.hubspot.com", url: "https://academy.hubspot.com/courses/inbound-marketing", category: "Marketing", duration: "3 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Java Programming", provider: "Infosys Springboard", domain: "infyspringboard.onwingspan.com", url: "https://infyspringboard.onwingspan.com/web/en/page/home", category: "Web Dev", duration: "Self-paced", certFree: true, verified: "Sep 2026" },
  { title: "Python for Beginners", provider: "Microsoft Learn", domain: "learn.microsoft.com", url: "https://learn.microsoft.com/en-us/shows/intro-to-python-development/", category: "Web Dev", duration: "5 hrs", certFree: false, verified: "Sep 2026" },
];

const CATEGORIES = ["All", "Cloud", "AI/ML", "Web Dev", "Data", "Marketing"];
const BRANDS = ["Google", "Microsoft", "AWS", "NVIDIA", "IBM", "Meta", "freeCodeCamp", "HubSpot", "Infosys"];
const FLOATERS = [Award, GraduationCap, ShieldCheck, BadgeCheck, Sparkles];

function HeroSpotlight() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  function onMove(e: ReactMouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  }

  const bg = useTransform([x, y], ([lx, ly]) =>
    `radial-gradient(420px circle at ${lx}px ${ly}px, rgba(42,76,255,0.14), transparent 70%)`
  );

  return (
    <motion.div
      onMouseMove={onMove}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden md:block"
      style={{ background: bg }}
    />
  );
}

function TiltCard({ course, index }: { course: Course; index: number }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });

  function onMove(e: ReactMouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 10);
    rx.set(py * -10);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor-hover
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: EASE }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
      className="group relative overflow-hidden rounded-2xl p-px shadow-[0_10px_30px_-14px_rgba(15,23,42,0.2)] transition-shadow duration-300 hover:shadow-[0_28px_60px_-20px_rgba(15,23,42,0.35)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="aspect-square w-[200%]"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(0,0,0,0) 0deg, rgba(42,76,255,0.9) 60deg, rgba(15,179,125,0.9) 120deg, rgba(0,0,0,0) 200deg, rgba(0,0,0,0) 360deg)",
          }}
        />
      </div>

      <div className="relative rounded-[15px] border border-black/5 bg-white/90 p-5 backdrop-blur">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-signal/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="relative flex items-start justify-between">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signal to-signal-deep text-base font-semibold text-white shadow-md shadow-signal/20">
            {course.provider.charAt(0)}
          </span>
          <ArrowUpRight
            size={17}
            className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
          />
        </div>

        <p className="relative mt-4 text-[15px] font-semibold leading-snug text-graphite">
          {course.title}
        </p>
        <p className="relative mt-0.5 text-sm text-muted">{course.provider}</p>

        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium " +
              (course.certFree ? "bg-mint/15 text-mint-deep" : "bg-amber-100 text-amber-700")
            }
          >
            <BadgeCheck size={12} />
            {course.certFree ? "Free certificate" : "Free course · paid certificate"}
          </span>
          <span className="text-muted">{course.duration}</span>
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <ExternalLink size={11} />
            {course.domain}
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={11} className="text-mint" />
            Verified {course.verified}
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function FreeCoursesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const floatersRef = useRef(FLOATERS);

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      const matchesCategory = category === "All" || c.category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || c.title.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const certFreeCount = COURSES.filter((c) => c.certFree).length;
  const brandCount = new Set(COURSES.map((c) => c.provider)).size;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-paper">
      {/* dot grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgba(15,23,42,0.18) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 100%)",
        }}
      />

      {/* aurora blobs */}
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

      {/* floating certificate icons */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden md:block">
        {floatersRef.current.map((Icon, i) => (
          <motion.span
            key={i}
            className="absolute text-signal/10"
            style={{
              left: `${12 + i * 18}%`,
              top: `${8 + (i % 3) * 22}%`,
            }}
            animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
            transition={{
              duration: 8 + i * 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          >
            <Icon size={34 + (i % 3) * 10} />
          </motion.span>
        ))}
      </div>

      <Navbar />

      <section className="relative mx-auto max-w-6xl px-6 pb-8 pt-14 md:pt-20">
        <HeroSpotlight />

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-graphite shadow-sm backdrop-blur">
            <ShieldCheck size={13} className="text-mint" />
            Verified genuinely free &middot; No third-party links
          </span>

          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-graphite md:text-5xl">
            {["Free", "certificates."].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: EASE }}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))}
            <br />
            {["Straight", "from", "the", "source."].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.5, ease: EASE }}
                className="inline-block bg-gradient-to-r from-signal to-mint bg-clip-text text-transparent"
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted"
          >
            Every course here is checked by hand. Every link goes straight to
            the company&apos;s own site — no redirects, no middlemen.
          </motion.p>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5, ease: EASE }}
            className="mx-auto mt-7 flex max-w-md items-center justify-center divide-x divide-black/5 rounded-2xl border border-black/5 bg-white/70 py-3 shadow-sm backdrop-blur"
          >
            {[
              { n: COURSES.length, label: "Courses" },
              { n: brandCount, label: "Companies" },
              { n: certFreeCount, label: "Free certs" },
            ].map((s) => (
              <div key={s.label} className="flex-1 px-2 text-center">
                <p className="text-xl font-semibold text-graphite">{s.n}</p>
                <p className="text-[11px] text-muted">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* brand marquee */}
      <div className="relative mb-10 overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" />
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-10 whitespace-nowrap"
        >
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={b + i} className="text-sm font-medium tracking-wide text-muted/70">
              {b}
            </span>
          ))}
        </motion.div>
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
          className="mx-auto flex max-w-2xl flex-col gap-4"
        >
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
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
        <motion.div layout className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((course, i) => (
              <TiltCard key={course.title + course.provider} course={course} index={i} />
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