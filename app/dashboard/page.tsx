export const dynamic = 'force-dynamic';

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JobFeed from "@/components/job-feed";
import { Badge } from "@/components/ui/badge";



export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-[17px] font-semibold tracking-tight text-graphite">
            Intern<span className="text-signal">Hunt</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="mint">Premium unlocked</Badge>
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-graphite md:text-3xl">
            Your feed
          </h1>
          <p className="mt-1 text-sm text-muted">
            {jobs?.length ?? 0} live listings, updated continuously.
          </p>
        </div>

        <JobFeed jobs={jobs ?? []} />
      </div>
    </main>
  );
}