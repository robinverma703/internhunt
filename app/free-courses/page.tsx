"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Search,
  ShieldCheck,
  ExternalLink,
  Award,
  GraduationCap,
  Cloud,
  Cpu,
  Database,
  Rocket,
  Star,
  Trophy,
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
  { title: "Networking Basics (Skills for All)", provider: "Cisco Networking Academy", domain: "skillsforall.com", url: "https://skillsforall.com/", category: "Cloud", duration: "15 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Salesforce Admin Trailhead Path", provider: "Salesforce Trailhead", domain: "trailhead.salesforce.com", url: "https://trailhead.salesforce.com/", category: "Data", duration: "Self-paced", certFree: true, verified: "Sep 2026" },
  { title: "OCI Foundations", provider: "Oracle University", domain: "mylearn.oracle.com", url: "https://mylearn.oracle.com/ou/learning-path/become-an-oci-foundations-associate/", category: "Cloud", duration: "5 hrs", certFree: false, verified: "Sep 2026" },
  { title: "NSE 1-3 Network Security", provider: "Fortinet Training Institute", domain: "training.fortinet.com", url: "https://training.fortinet.com/", category: "Cloud", duration: "4 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Cybersecurity Foundation", provider: "Palo Alto Networks", domain: "paloaltonetworks.com", url: "https://www.paloaltonetworks.com/cybersecurity-academy", category: "Cloud", duration: "6 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Diploma in Digital Marketing", provider: "Alison", domain: "alison.com", url: "https://alison.com/", category: "Marketing", duration: "6-10 hrs", certFree: false, verified: "Sep 2026" },
  { title: "Intro to Machine Learning", provider: "Kaggle Learn", domain: "kaggle.com", url: "https://www.kaggle.com/learn", category: "AI/ML", duration: "3 hrs", certFree: true, verified: "Sep 2026" },
  { title: "Academic Interface & Soft Skills", provider: "Great Learning Academy", domain: "mygreatlearning.com", url: "https://www.mygreatlearning.com/academy", category: "Data", duration: "Self-paced", certFree: true, verified: "Sep 2026" },
];

const CATEGORIES = ["All", "Cloud", "AI/ML", "Web Dev", "Data", "Marketing"];
const BRANDS = [
  "Google", "Microsoft", "AWS", "NVIDIA", "IBM", "freeCodeCamp", "HubSpot", "Infosys",
  "Cisco", "Salesforce", "Oracle", "Fortinet", "Palo Alto Networks", "Alison", "Kaggle", "Great Learning",
];
const ROTATING_NAMES = [
  "Google", "Microsoft", "AWS", "NVIDIA", "IBM", "Cisco", "Salesforce",
  "Fortinet", "Palo Alto Networks", "HubSpot", "Infosys", "freeCodeCamp",
  "Kaggle", "Great Learning", "Meta", "Khan Academy", "HP LIFE",
];
function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ROTATING_NAMES.length), 1800);
    return () => clearInterval(id);
  }, []);
  return (
        <span className="relative inline-block h-[1.2em] min-w-[7ch] overflow-hidden pb-1 align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING_NAMES[i]}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="inline-block bg-gradient-to-r from-signal via-mint to-signal bg-clip-text text-transparent"
        >
          {ROTATING_NAMES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function FloatingBadge({
  Icon,
  label,
  style,
  duration,
}: {
  Icon: typeof Award;
  label: string;
  style: React.CSSProperties;
  duration: number;
}) {
  return (
    <motion.div
      style={{ ...style, transformStyle: "preserve-3d" }}
      className="pointer-events-none absolute hidden md:block"
      animate={{ y: [0, -16, 0], rotateY: [0, 14, 0, -14, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex w-36 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signal to-mint text-white">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-white/90">{label}</p>
          <p className="text-[9px] text-white/40">Verified free</p>
        </div>
      </div>
    </motion.div>
  );
}

function HeroSpotlight() {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  function onMove(e: ReactMouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width) * 100);
    y.set(((e.clientY - r.top) / r.height) * 100);
  }
  return (
    <motion.div
      onMouseMove={onMove}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden md:block"
      style={{
        background: useMotionValue(
          "radial-gradient(500px circle at 50% 40%, rgba(255,255,255,0.06), transparent 70%)"
        ),
      }}
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
      transition={{ delay: index * 0.04, duration: 0.45, ease: EASE }}
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
          <ArrowUpRight size={17} className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal" />
        </div>
        <p className="relative mt-4 text-[15px] font-semibold leading-snug text-graphite">{course.title}</p>
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
    <main className="relative isolate min-h-screen bg-paper">
      <style>{`
        @keyframes ih-marquee { from { transform: translateX(0); } to { transform: translateX(-33.3333%); } }
        .ih-marquee-track { animation: ih-marquee 30s linear infinite; }
        @keyframes ih-grid-move { from { background-position: 0 0; } to { background-position: 0 60px; } }
        .ih-grid-floor { animation: ih-grid-move 6s linear infinite; }
        @keyframes ih-twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.7; } }
      `}</style>

      {/* ===== DARK LUXURY HERO ===== */}
      <div className="relative overflow-hidden bg-[#05070f]">
        {/* stars */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-[2px] w-[2px] rounded-full bg-white"
              style={{
                left: `${(i * 47) % 100}%`,
                top: `${(i * 29) % 70}%`,
                animation: `ih-twinkle ${3 + (i % 5)}s ease-in-out infinite`,
                animationDelay: `${(i % 7) * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* color mesh */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-32 top-0 h-[460px] w-[460px] rounded-full bg-signal/30 blur-[130px]"
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
            transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-24 top-10 h-[420px] w-[420px] rounded-full bg-mint/25 blur-[130px]"
          />
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-[120px]"
          />
        </div>

        {/* 3D perspective grid floor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] overflow-hidden"
          style={{ perspective: "500px" }}
        >
          <div
            className="ih-grid-floor absolute inset-x-[-50%] bottom-0 h-[500px]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              transform: "rotateX(75deg)",
              transformOrigin: "bottom",
              maskImage: "linear-gradient(to top, black, transparent)",
              WebkitMaskImage: "linear-gradient(to top, black, transparent)",
            }}
          />
        </div>

        <HeroSpotlight />

               {/* floating 3D badges */}
        <FloatingBadge Icon={Award} label="Google Cloud" style={{ left: "5%", top: "20%" }} duration={7} />
        <FloatingBadge Icon={ShieldCheck} label="AWS Skill Builder" style={{ right: "5%", top: "16%" }} duration={8.5} />
        <FloatingBadge Icon={GraduationCap} label="Microsoft Learn" style={{ right: "10%", top: "64%" }} duration={9.5} />
        <FloatingBadge Icon={Cpu} label="NVIDIA DLI" style={{ left: "10%", top: "62%" }} duration={6.5} />
        <FloatingBadge Icon={Database} label="IBM SkillsBuild" style={{ left: "2%", top: "48%" }} duration={10} />
        <FloatingBadge Icon={Cloud} label="Cisco Academy" style={{ right: "2%", top: "44%" }} duration={7.8} />
        <FloatingBadge Icon={Trophy} label="Salesforce Trailhead" style={{ left: "20%", top: "8%" }} duration={9} />
        <FloatingBadge Icon={Star} label="Fortinet Training" style={{ right: "20%", top: "6%" }} duration={8} />
        <FloatingBadge Icon={Rocket} label="freeCodeCamp" style={{ left: "16%", top: "78%" }} duration={7.2} />
        <FloatingBadge Icon={BadgeCheck} label="Palo Alto Networks" style={{ right: "16%", top: "80%" }} duration={9.8} />
        <FloatingBadge Icon={GraduationCap} label="HubSpot Academy" style={{ left: "34%", top: "12%" }} duration={6.8} />
        <FloatingBadge Icon={Award} label="Kaggle Learn" style={{ right: "34%", top: "70%" }} duration={8.3} />

        <Navbar dimUntilInteract />

        <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-10 md:pb-28 md:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
              <ShieldCheck size={13} className="text-mint" />
              Verified genuinely free &middot; No third-party links
            </span>

                        <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-[1.3] tracking-tight text-white md:text-5xl">
              Free certificates
              <br />
              <span className="mt-1 inline-flex items-baseline gap-3">
                from <RotatingWord />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/50"
            >
              Every course here is checked by hand. Every link goes straight to
              the company&apos;s own site — no redirects, no middlemen.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
              className="mx-auto mt-8 flex max-w-md items-center justify-center divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.06] py-3 backdrop-blur"
            >
              {[
                { n: COURSES.length, label: "Courses" },
                { n: brandCount, label: "Companies" },
                { n: certFreeCount, label: "Free certs" },
              ].map((s) => (
                <div key={s.label} className="flex-1 px-2 text-center">
                  <p className="text-xl font-semibold text-white">{s.n}</p>
                  <p className="text-[11px] text-white/40">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* fade into light content */}
               <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-transparent to-paper" />
      </div>
      {/* ===== END DARK HERO ===== */}

      {/* brand marquee */}
      <div className="relative -mt-2 mb-10 overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" />
        <div className="ih-marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => (
            <span key={b + i} className="text-sm font-medium tracking-wide text-muted/70">
              {b}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-20">
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