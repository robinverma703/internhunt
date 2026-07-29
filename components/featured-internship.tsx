import { Building2, IndianRupee, ArrowUpRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/components/job-card";

export default function FeaturedInternship({ job }: { job: Job }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Star size={18} className="fill-signal text-signal" />
        <span className="text-sm font-semibold uppercase tracking-wide text-signal">
          Internship of the Week
        </span>
        <Star size={18} className="fill-signal text-signal" />
      </div>
      <Card className="border-signal/30 bg-gradient-to-b from-signal-dim/50 to-surface shadow-card-hover">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-signal-dim text-signal">
            <Building2 size={24} />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold text-graphite">{job.title}</h3>
            <p className="mt-1 text-sm text-muted">{job.company}</p>
          </div>
          <Badge variant="outline">{job.category}</Badge>
          {job.stipend && (
            <span className="flex items-center gap-1 font-mono text-lg font-semibold text-graphite">
              <IndianRupee size={16} />
              {job.stipend}
            </span>
          )}
          <a href={job.link} target="_blank" rel="noopener noreferrer" data-cursor-hover className="mt-2 inline-flex items-center gap-2 rounded-full bg-graphite px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-signal">
            Apply Now
            <ArrowUpRight size={15} />
          </a>
        </CardContent>
      </Card>
    </section>
  );
}