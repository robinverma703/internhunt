"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitPayment } from "@/lib/actions/submit-payment";

const PERKS = [
  "Every internship & job link, unlocked",
  "Search and filter by category, stipend, company",
  "New listings added continuously — no stale posts",
  "Priority WhatsApp & Telegram support",
];

interface PayCheckoutProps {
  priceRupees: number;
  isRenewal: boolean;
}

export default function PayCheckout({ priceRupees, isRenewal }: PayCheckoutProps) {
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await submitPayment(utr, priceRupees);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <Card className="border-signal/20">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-dim text-signal">
                <CheckCircle2 size={22} />
              </span>
              <h1 className="text-xl font-semibold text-graphite">Payment submitted!</h1>
              <p className="text-sm text-muted">
                We're verifying your payment. Your access will be activated shortly —
                you'll get a WhatsApp message once it's unlocked. Usually takes a
                couple of hours.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Card className="border-signal/20">
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-dim text-signal">
              <Lock size={20} />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-graphite">
                {isRenewal ? "Renew your access" : "Unlock the full feed"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                You can browse listings, but links stay locked until you unlock.
              </p>
            </div>

            <div>
              <span className="text-4xl font-semibold tracking-tight text-graphite">
                ₹{priceRupees}
              </span>
              <span className="ml-1.5 text-sm text-muted">· 7 days access</span>
            </div>

            <ul className="w-full space-y-2 text-left text-sm text-graphite">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-mint" />
                  {perk}
                </li>
              ))}
            </ul>

            <div className="w-full rounded-xl border border-line bg-white p-4">
              <Image
                src="/upi-qr.png"
                alt="Scan to pay via UPI"
                width={280}
                height={400}
                className="mx-auto h-auto w-full max-w-[220px] rounded-lg"
              />
              <p className="mt-3 text-xs text-muted">
                Scan &amp; pay ₹{priceRupees} using any UPI app, then enter the
                transaction / UTR number below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="UTR / Transaction ID"
                required
                className="w-full rounded-xl border border-line bg-paper px-4 py-3.5 text-[15px] text-graphite outline-none transition focus:border-signal focus:ring-4 focus:ring-signal-dim"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                variant="signal"
                size="lg"
                className="w-full"
                data-cursor-hover
                disabled={loading || utr.trim().length < 6}
              >
                {loading ? "Submitting…" : "I've paid — submit for verification"}
              </Button>
            </form>

            <p className="text-xs text-muted">
              Where do I find the UTR? Open your UPI app → payment history → tap
              the payment → copy the "UTR" or "Transaction ID".
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}