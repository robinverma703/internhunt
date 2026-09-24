"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValue,
} from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

const LINKS = [
  { label: "How it works", href: "/#how-it-works", badge: false },
  { label: "Pricing", href: "/#pricing", badge: false },
  { label: "Hackathons", href: "/hackathons", badge: true },
  { label: "Post a Job", href: "/post-job", badge: false },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function MagneticCTA() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });

  function onMove(e: ReactMouseEvent<HTMLSpanElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <Link href="/login" data-cursor-hover>
      <motion.span
        style={{ x: sx, y: sy }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileTap={{ scale: 0.95 }}
        className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-signal px-5 py-2 text-sm font-medium text-white shadow-lg shadow-signal/30"
      >
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/30"
          initial={{ x: "-150%" }}
          animate={{ x: "450%" }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 2.8,
            ease: "easeInOut",
          }}
        />
        <span className="relative">Get started</span>
        <ArrowRight size={15} className="relative" />
      </motion.span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const lastY = useRef(0);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (y > 240 && y > lastY.current + 4) {
        setHidden(true);
      } else if (y < lastY.current - 4 || y <= 240) {
        setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const radius = open ? "rounded-3xl" : "rounded-full";

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: hidden && !open ? -110 : 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
            className="sticky top-0 z-40 px-3 pt-2 sm:px-4 sm:pt-3"
    >
      <motion.div
        animate={{ maxWidth: scrolled ? 900 : 1120 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={
          "relative mx-auto w-full overflow-hidden p-px transition-[border-radius,box-shadow] duration-300 " +
          radius +
          (scrolled
            ? " shadow-[0_18px_50px_-14px_rgba(15,23,42,0.3)]"
            : " shadow-[0_6px_24px_-10px_rgba(15,23,42,0.15)]")
        }
      >
        {/* rotating glow border */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            className="aspect-square w-[220%] opacity-70"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(0,0,0,0.04) 0deg, rgba(61,90,254,0.9) 70deg, rgba(52,211,153,0.9) 130deg, rgba(0,0,0,0.04) 200deg, rgba(0,0,0,0.04) 360deg)",
            }}
          />
        </div>

        {/* inner pill */}
        <div
          className={
            "relative bg-white/90 backdrop-blur-xl transition-[border-radius] duration-300 " +
            radius
          }
        >
                    <div className="flex items-center justify-between px-4 py-2 md:px-6 md:py-2.5">
            {/* Logo */}
            <Link href="/" data-cursor-hover className="flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="h-2 w-2 rounded-full bg-signal"
              />
              <span className="font-display text-[17px] font-semibold tracking-tight text-graphite">
                Intern<span className="text-signal">Hunt</span>
              </span>
            </Link>

            {/* Desktop links */}
            <nav
              className="hidden items-center gap-1 text-sm md:flex"
              onMouseLeave={() => setHovered(null)}
            >
              {LINKS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-cursor-hover
                    onMouseEnter={() => setHovered(item.href)}
                    className="relative flex items-center gap-1.5 px-4 py-2 text-muted transition-colors hover:text-graphite"
                  >
                    {hovered === item.href && (
                      <motion.span
                        layoutId="nav-hover"
                        className="absolute inset-0 rounded-full bg-black/5"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                      />
                    )}
                    <span className={"relative z-10 " + (active ? "text-graphite" : "")}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="relative z-10 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-emerald-700">
                        New
                      </span>
                    )}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-signal"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <MagneticCTA />
              </div>
              <div className="sm:hidden">
                <Link href="/login" data-cursor-hover>
                                   <span className="inline-flex items-center rounded-full bg-signal px-3.5 py-1.5 text-[13px] font-medium text-white">
                    Get started
                  </span>
                </Link>
              </div>

              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-graphite transition-colors hover:bg-black/5 md:hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={open ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {open ? <X size={20} /> : <Menu size={20} />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="overflow-hidden md:hidden"
              >
                <div className="flex flex-col px-6 pb-5 pt-1">
                  {LINKS.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ x: -18, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.06 * i + 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-4 border-b border-black/5 py-4 last:border-b-0"
                      >
                        <span className="text-xs font-medium tabular-nums text-muted">
                          0{i + 1}
                        </span>
                        <span className="flex-1 text-xl font-medium tracking-tight text-graphite">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            New
                          </span>
                        )}
                        <ArrowRight size={18} className="text-muted" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* scroll progress line */}
          <motion.div
            aria-hidden
                       style={{ scaleX: progress }}
            animate={{ opacity: scrolled ? 1 : 0 }}
            className="absolute bottom-0 left-8 right-8 h-[2px] origin-left rounded-full bg-gradient-to-r from-signal to-emerald-400"
          />
        </div>
      </motion.div>
    </motion.header>
  );
}