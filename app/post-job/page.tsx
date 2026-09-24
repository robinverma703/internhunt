"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Zap,
  Users,
  Lock,
  MapPin,
  Wallet,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/navbar";

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Data / AI",
  "Design",
  "Marketing",
  "Product",
  "Internship",
  "General",
];

const PERKS = [
  {
    icon: BadgeCheck,
    title: "Hand-verified listings",
    text: "Our team reviews every post before it goes live.",
  },
  {
    icon: Zap,
    title: "Live within a day",
    text: "Submit now, get in front of candidates fast.",
  },
  {
    icon: Users,
    title: "Reach real candidates",
    text: "Students and freshers actively hunting for roles.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
};

function FloatField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  maxLength,
}: FieldProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? " "}
        className="peer h-14 w-full rounded-2xl border border-line bg-white/80 px-4 pt-5 text-[15px] text-graphite outline-none transition-all placeholder:text-transparent focus:border-signal focus:bg-white focus:shadow-[0_0_0_4px_rgba(42,76,255,0.10)] focus:placeholder:text-muted/60"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-4 origin-left text-[15px] text-muted transition-all duration-200 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-signal peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-75"
      >
        {label}
        {required && <span className="text-signal"> *</span>}
      </label>
    </div>
  );
}

function FloatTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: Omit<FieldProps, "type" | "maxLength">) {
  return (
    <div className="relative">
      <textarea
        id={id}
        required={required}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? " "}
        className="peer min-h-[150px] w-full resize-none rounded-2xl border border-line bg-white/80 px-4 pb-4 pt-7 text-[15px] leading-relaxed text-graphite outline-none transition-all placeholder:text-transparent focus:border-signal focus:bg-white focus:shadow-[0_0_0_4px_rgba(42,76,255,0.10)] focus:placeholder:text-muted/60"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-4 origin-left text-[15px] text-muted transition-all duration-200 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-signal peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-75"
      >
        {label}
        {required && <span className="text-signal"> *</span>}
      </label>
    </div>
  );
}

export default function PostJobPage() {
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    stipend: "",
    location: "",
    link: "",
    category: "General",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Something went wrong. Please try again." });
      } else {
        setResult({ ok: true, message: data.message ?? "Submitted for review!" });
        setForm({
          title: "",
          company: "",
          description: "",
          stipend: "",
          location: "",
          link: "",
          category: "General",
        });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const success = result?.ok === true;
  const previewTitle = form.title.trim() || "Frontend Engineering Intern";
  const previewCompany = form.company.trim() || "Your Company";
  const previewDesc =
    form.description.trim() ||
    "Your role description will appear here, exactly the way candidates will read it.";

  return (
    <main className="relative isolate min-h-screen bg-paper">
      {/* aurora background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-signal/20 blur-[110px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 top-64 h-[380px] w-[380px] rounded-full bg-mint/20 blur-[110px]"
        />
      </div>

      <Navbar />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pt-16">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-graphite shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
            Free to post &middot; Reviewed within a day
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-graphite md:text-5xl">
            Hire the next{" "}
            <span className="bg-gradient-to-r from-signal to-mint bg-clip-text text-transparent">
              great
            </span>{" "}
            intern.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            List your opening on InternHunt and reach candidates who are actively
            looking. It takes two minutes.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {PERKS.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.5, ease: EASE }}
                  className="flex items-start gap-3.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal/10 text-signal">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium text-graphite">{perk.title}</p>
                    <p className="text-sm text-muted">{perk.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* live preview */}
          <div className="mt-10 hidden lg:block">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Live preview
            </p>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signal to-signal-deep text-lg font-semibold text-white">
                  {previewCompany.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-graphite">
                    {previewTitle}
                  </p>
                  <p className="truncate text-sm text-muted">{previewCompany}</p>
                </div>
                <span className="rounded-full bg-signal/10 px-2.5 py-1 text-[11px] font-medium text-signal">
                  {form.category}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
                {previewDesc}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-graphite">
                <span className="inline-flex items-center gap-1.5">
                  <Wallet size={14} className="text-mint" />
                  {form.stipend.trim() || "Stipend"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-signal" />
                  {form.location.trim() || "Location"}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 font-medium text-signal">
                  Apply <ArrowRight size={13} />
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT: form card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        >
          <div className="relative overflow-hidden rounded-[28px] p-px shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
            {/* rotating glow border */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                className="aspect-square w-[180%] opacity-70"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(0,0,0,0.04) 0deg, rgba(42,76,255,0.9) 70deg, rgba(15,179,125,0.9) 130deg, rgba(0,0,0,0.04) 200deg, rgba(0,0,0,0.04) 360deg)",
                }}
              />
            </div>

            <div className="relative rounded-[27px] bg-white/90 p-6 backdrop-blur-xl md:p-9">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="flex flex-col items-center px-2 py-10 text-center"
                  >
                    <motion.svg viewBox="0 0 52 52" className="h-20 w-20 text-mint">
                      <motion.circle
                        cx="26"
                        cy="26"
                        r="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                      <motion.path
                        d="M15 27l8 8 14-16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      />
                    </motion.svg>
                    <h2 className="mt-6 text-2xl font-semibold tracking-tight text-graphite">
                      You&apos;re all set!
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      {result?.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="mt-7 inline-flex items-center gap-2 rounded-full bg-graphite px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
                    >
                      Post another role <ArrowRight size={15} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-graphite">
                        Tell us about the role
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        Fields marked <span className="text-signal">*</span> are required.
                      </p>
                    </div>

                    <FloatField
                      id="title"
                      label="Job title"
                      required
                      maxLength={200}
                      value={form.title}
                      onChange={(v) => update("title", v)}
                      placeholder="e.g. Frontend Engineering Intern"
                    />

                    <FloatField
                      id="company"
                      label="Company name"
                      required
                      maxLength={200}
                      value={form.company}
                      onChange={(v) => update("company", v)}
                      placeholder="e.g. Acme Technologies"
                    />

                    <div>
                      <p className="mb-2.5 text-sm font-medium text-graphite">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => {
                          const active = form.category === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => update("category", c)}
                              className={
                                "relative rounded-full border px-4 py-1.5 text-sm transition-colors " +
                                (active
                                  ? "border-transparent text-white"
                                  : "border-line bg-white/70 text-muted hover:text-graphite")
                              }
                            >
                              {active && (
                                <motion.span
                                  layoutId="cat-active"
                                  className="absolute inset-0 rounded-full bg-gradient-to-r from-signal to-signal-deep shadow-md shadow-signal/30"
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                              )}
                              <span className="relative">{c}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <FloatTextarea
                        id="description"
                        label="Description"
                        required
                        value={form.description}
                        onChange={(v) => update("description", v)}
                        placeholder="What will the person work on? What are you looking for?"
                      />
                      <p className="mt-1.5 text-right text-xs text-muted">
                        {form.description.length} characters
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <FloatField
                        id="stipend"
                        label="Stipend / Salary"
                        value={form.stipend}
                        onChange={(v) => update("stipend", v)}
                        placeholder="e.g. ₹15,000/mo"
                      />
                      <FloatField
                        id="location"
                        label="Location"
                        value={form.location}
                        onChange={(v) => update("location", v)}
                        placeholder="e.g. Remote / Bengaluru"
                      />
                    </div>

                    <FloatField
                      id="link"
                      label="Application link"
                      required
                      type="url"
                      value={form.link}
                      onChange={(v) => update("link", v)}
                      placeholder="https://..."
                    />

                    <AnimatePresence>
                      {result && !result.ok && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                        >
                          {result.message}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      className="relative mt-1 inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-signal to-signal-deep text-base font-medium text-white shadow-lg shadow-signal/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 w-1/4 -skew-x-12 bg-white/25"
                        initial={{ x: "-200%" }}
                        animate={{ x: "600%" }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          repeatDelay: 2.5,
                          ease: "easeInOut",
                        }}
                      />
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="relative animate-spin" />
                          <span className="relative">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative">Submit for review</span>
                          <ArrowRight size={18} className="relative" />
                        </>
                      )}
                    </motion.button>

                    <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
                      <Lock size={12} />
                      Free to post &middot; Reviewed by our team &middot; Live within a day
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            <Link href="/" className="underline hover:text-graphite">
              Back to InternHunt
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}