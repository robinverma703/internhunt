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

  // Rank by stipend (highest first), then take the top few and rotate
  // through them daily, so the same listing doesn't get stuck forever
  // just because nothing has topped it yet.
  const ranked = [...jobs].sort(
    (a, b) => getStipendValue(b.stipend) - getStipendValue(a.stipend)
  );
  const topPool = ranked.slice(0, Math.min(5, ranked.length));

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % topPool.length;

  return topPool[index] as Job;
}