import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/components/job-card";

function getStipendValue(stipend: string | null): number {
  if (!stipend) return 0;
  const match = stipend.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export async function getFeaturedJob(): Promise<Job | null> {
  const supabase = await createClient();
  const { data: jobs } = await supabase.from("jobs").select("*");

  if (!jobs || jobs.length === 0) return null;

  const featured = jobs.reduce((best, current) =>
    getStipendValue(current.stipend) > getStipendValue(best.stipend) ? current : best
  );

  return featured as Job;
}