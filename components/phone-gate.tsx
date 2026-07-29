"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { savePhone } from "@/lib/actions/save-phone";
import { Button } from "@/components/ui/button";

export default function PhoneGate() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await savePhone(phone);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/60 px-6 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-signal via-signal-deep to-signal" />

          <div className="px-8 py-10">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-signal-dim">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-signal"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>

            <h2 className="text-center text-xl font-semibold tracking-tight text-graphite">
              One last step
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted">
              Add your number and never miss a new internship —
              alerts land straight on WhatsApp.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  maxLength={10}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-line bg-paper py-3.5 pl-12 pr-4 text-[15px] tracking-wide text-graphite outline-none transition focus:border-signal focus:ring-4 focus:ring-signal-dim"
                />
              </div>

              {error && (
                <p className="text-center text-xs font-medium text-red-500">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="signal"
                size="lg"
                disabled={loading || phone.length !== 10}
                className="mt-1 w-full shadow-lg shadow-signal/20"
              >
                {loading ? "Saving…" : "Continue"}
              </Button>
            </form>

            <p className="mt-5 text-center text-[11px] text-muted/80">
              We only use this to send you internship alerts. No spam, ever.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}