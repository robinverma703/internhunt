"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Mail, Youtube, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ABOUT_LINKS = [
  { label: "Our story", href: "#" },
  { label: "How we verify listings", href: "#" },
  { label: "Contact support", href: "#" },
];

const SOCIALS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-graphite p-8 text-white shadow-card"
          >
            <h3 className="font-display text-lg font-semibold">Never miss a drop</h3>
            <p className="mt-2 text-sm text-white/60">
              Get the best new internships in your inbox, no spam, just listings.
            </p>

            {submitted ? (
              <p className="mt-6 flex items-center gap-2 text-sm font-medium text-mint">
                You are on the list. Watch your inbox.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus-visible:ring-signal"
                  />
                </div>
                <Button type="submit" variant="signal" className="group shrink-0" data-cursor-hover>
                  Subscribe
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </form>
            )}
          </motion.div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Follow us
            </h4>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  data-cursor-hover
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-mint-dim text-mint transition-transform hover:scale-105"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              About us
            </h4>
            <ul className="mt-5 space-y-3">
              {ABOUT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    data-cursor-hover
                    className="text-sm text-graphite transition-colors hover:text-signal"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-6">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} InternHunt. Built for people trying to actually get hired.
          </p>
        </div>
      </div>
    </footer>
  );
}
