"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/components/job-card";

const EMPTY = {
  title: "",
  company: "",
  description: "",
  stipend: "",
  link: "",
  category: "General",
};

export default function AdminJobForm({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [jobs, setJobs] = useState(initialJobs);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add job");
      setJobs((j) => [data.job, ...j]);
      setForm(EMPTY);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setJobs((j) => j.filter((job) => job.id !== id));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-display text-base font-semibold text-graphite">Add a listing</h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" required value={form.company} onChange={(e) => update("company", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" required value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="stipend">Stipend</Label>
                <Input id="stipend" placeholder="e.g. 15,000/mo" value={form.stipend} onChange={(e) => update("stipend", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={form.category} onChange={(e) => update("category", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link">Application link</Label>
              <Input id="link" type="url" required value={form.link} onChange={(e) => update("link", e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" variant="signal" className="w-full" disabled={submitting} data-cursor-hover>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {submitting ? "Adding…" : "Add listing"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 font-display text-base font-semibold text-graphite">
          Live listings ({jobs.length})
        </h2>
        <div className="space-y-3">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              layout
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-graphite">{job.title}</p>
                <p className="text-xs text-muted">{job.company} · {job.category}</p>
              </div>
              <button
                data-cursor-hover
                onClick={() => handleDelete(job.id)}
                disabled={deletingId === job.id}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${job.title}`}
              >
                {deletingId === job.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </motion.div>
          ))}
          {jobs.length === 0 && <p className="text-sm text-muted">No listings yet — add the first one.</p>}
        </div>
      </div>
    </div>
  );
}
