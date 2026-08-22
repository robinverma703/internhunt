"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-graphite md:text-3xl">
            Post a job or internship
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hiring? List your opening here — free. Our team reviews every submission
            before it goes live, usually within a day.
          </p>

          <Card className="mt-8">
            <CardContent className="py-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <Label htmlFor="title">Job title *</Label>
                  <Input
                    id="title"
                    required
                    maxLength={200}
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Frontend Engineering Intern"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company name *</Label>
                  <Input
                    id="company"
                    required
                    maxLength={200}
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder="e.g. Acme Technologies"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={5}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="What will the person work on? What are you looking for?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stipend">Stipend / Salary</Label>
                    <Input
                      id="stipend"
                      value={form.stipend}
                      onChange={(e) => update("stipend", e.target.value)}
                      placeholder="e.g. ₹15,000/mo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      placeholder="e.g. Remote / Bengaluru"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-graphite"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="link">Application link *</Label>
                  <Input
                    id="link"
                    required
                    type="url"
                    value={form.link}
                    onChange={(e) => update("link", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {result && (
                  <p
                    className={`text-sm ${result.ok ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {result.message}
                  </p>
                )}

                <Button type="submit" variant="signal" size="lg" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit for review"}
                </Button>
              </form>
            </CardContent>
          </Card>

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