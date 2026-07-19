import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminJobForm from "@/components/admin-job-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
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
          <Badge variant="default">Admin</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-graphite">Admin panel</h1>
        <p className="mt-1 text-sm text-muted">Add, review, and remove listings from the live feed.</p>

        <div className="mt-8">
          <AdminJobForm initialJobs={jobs ?? []} />
        </div>
      </div>
    </main>
  );
}
