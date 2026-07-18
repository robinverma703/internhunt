"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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

        <Link href="/login" data-cursor-hover>
          <Button variant="signal" size="sm" className="shadow-sm">
            Get started
          </Button>
        </Link>
      </div>
    </motion.header>
  );
}