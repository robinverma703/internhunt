"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Hackathons", href: "/hackathons" },
  { label: "Post a Job", href: "/post-job" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClass = scrolled
    ? "sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md shadow-md"
    : "sticky top-0 z-40 border-b border-transparent bg-paper/80 backdrop-blur-md";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={headerClass}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" data-cursor-hover>
          <span className="font-display text-[17px] font-semibold tracking-tight text-graphite">
            Intern<span className="text-signal">Hunt</span>
          </span>
        </Link>

        {/* Desktop menu */}
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {LINKS.map(function (linkItem) {
            return (
              <Link
                key={linkItem.href}
                href={linkItem.href}
                data-cursor-hover
                className="relative py-1 transition-colors hover:text-graphite"
              >
                {linkItem.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" data-cursor-hover>
            <Button variant="signal" size="sm" className="shadow-sm">
              Get started
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={function () {
              setOpen(!open);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-graphite md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <div className="flex flex-col px-6 py-2">
              {LINKS.map(function (linkItem) {
                return (
                  <Link
                    key={linkItem.href}
                    href={linkItem.href}
                    onClick={function () {
                      setOpen(false);
                    }}
                    className="border-b border-line py-3 text-base text-graphite last:border-b-0"
                  >
                    {linkItem.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}