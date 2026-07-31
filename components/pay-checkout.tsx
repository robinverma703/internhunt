"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Upload, Loader2, AlertCircle } from "lucide-react";
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

type CheckStatus = "checking" | "waiting" | "approved" | "flagged" | "none";

export default function PayCheckout({ priceRupees, isRenewal }: PayCheckoutProps) {
  const router = useRouter();
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [checkStatus, setCheckStatus] = useState<CheckStatus>("checking");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!screenshot) {
      setError("Please upload a screenshot of your payment success screen");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("utr", utr);
    formData.append("amount", priceRupees.toString());
    formData.append("screenshot", screenshot);

    const result = await submitPayment(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  }

  // Poll for payment status once submitted
  useEffect(() => {
    if (!submitted) return;

    async function poll() {
      try {
        const res = await fetch("/api/check-payment-status");
        const data = await res.json();

        setCheckStatus(data.status);

        if (data.status === "waiting" && typeof data.secondsLeft === "number") {
          setSecondsLeft(data.secondsLeft);
        }

        if (data.status === "flagged") {
          setFlagReason(data.reason ?? null);
        }

        if (data.status === "approved") {
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => router.push("/dashboard"), 1800);
        }
      } catch {
        // network hiccup — just try again on next poll
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [submitted, router]);

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
              {checkStatus === "approved" ? (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-dim text-signal">
                    <CheckCircle2 size={22} />
                  </span>
                  <h1 className="text-xl font-semibold text-graphite">You're unlocked! 🎉</h1>
                  <p className="text-sm text-muted">
                    Payment verified. Taking you to your dashboard…
                  </p>
                </>
              ) : checkStatus === "flagged" ? (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertCircle size={22} />
                  </span>
                  <h1 className="text-xl font-semibold text-graphite">Needs a quick manual check</h1>
                  <p className="text-sm text-muted">
                    {flagReason ??
                      "We couldn't automatically confirm your payment. Our team will review it and unlock your access shortly."}
                  </p>
                </>
              ) : (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-dim text-signal">
                    <Loader2 size={22} className="animate-spin" />
                  </span>
                  <h1 className="text-xl font-semibold text-graphite">Verifying your payment…</h1>
                  <p className="text-sm text-muted">
                    Hang tight, this usually takes under 2 minutes.
                  </p>
                  {secondsLeft !== null && (
                    <div className="mt-1 text-3xl font-semibold tabular-nums text-signal">
                      {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                    </div>
                  )}
                </>
              )}
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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                  `upi://pay?pa=tusharverma016@axl&pn=InternHunt&am=${priceRupees}&cu=INR`
                )}`}
                alt="Scan to pay via UPI"
                width={280}
                height={280}
                unoptimized
                className="mx-auto h-auto w-full max-w-[220px] rounded-lg"
              />
              <p className="mt-3 text-xs text-muted">
                Scan &amp; pay ₹{priceRupees} using any UPI app, then enter the
                transaction / UTR number below and upload a screenshot.
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

              <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted transition hover:border-signal">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Payment screenshot preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Upload payment success screenshot</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                variant="signal"
                size="lg"
                className="w-full"
                data-cursor-hover
                disabled={loading || utr.trim().length < 6 || !screenshot}
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