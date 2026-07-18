"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PERKS = [
  "Every internship & job link, unlocked",
  "Search and filter by category, stipend, company",
  "New listings added continuously — no stale posts",
  "Priority WhatsApp & Telegram support",
];

export default function PayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/razorpay/create-order", { method: "POST" });
      if (!res.ok) throw new Error("Could not start checkout. Please try again.");
      const order = await res.json();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "InternHunt",
        description: "Lifetime access to the curated job feed",
        theme: { color: "#2A4CFF" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            router.push("/dashboard");
            router.refresh();
          } else {
            setError("Payment captured, but unlocking failed. Contact support and we'll sort it out.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
              <h1 className="text-xl font-semibold text-graphite">Unlock the full feed</h1>
              <p className="mt-1 text-sm text-muted">
                You can browse listings, but links stay locked until you unlock.
              </p>
            </div>

            <div>
              <span className="text-4xl font-semibold tracking-tight text-graphite">₹99</span>
              <span className="ml-1.5 text-sm text-muted">one-time · lifetime</span>
            </div>

            <ul className="w-full space-y-2 text-left text-sm text-graphite">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-mint" />
                  {perk}
                </li>
              ))}
            </ul>

            <Button
              variant="signal"
              size="lg"
              className="w-full"
              data-cursor-hover
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? "Opening checkout…" : "Pay ₹99 & unlock"}
            </Button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <p className="text-xs text-muted">Secured by Razorpay. Cards, UPI, netbanking.</p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
