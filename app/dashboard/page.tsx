export const dynamic = 'force-dynamic';

import Link from "next/link";
import ResumeUpload from "@/components/resume-upload";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import JobFeed from "@/components/job-feed";
import ReferralCard from "@/components/referral-card";
import { Badge } from "@/components/ui/badge";
import PhoneGate from "@/components/phone-gate";



export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  const serviceClient = createServiceRoleClient();
    const { data: profile, error: profileError } = await serviceClient
    .from("users")
    .select("referral_code, referral_earnings, phone, resume_filename, resume_skills, resume_summary")
    .eq("id", user?.id ?? "")
    .single();

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user?.id ?? "");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const referralLink = profile?.referral_code
    ? `${siteUrl}/?ref=${profile.referral_code}`
    : "";

  return (
    <main className="min-h-screen bg-paper">
      
      {!profile?.phone && <PhoneGate />}
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

        <ResumeUpload
          initialFilename={profile?.resume_filename}
          initialSkills={profile?.resume_skills ?? []}
          initialSummary={profile?.resume_summary}
          jobs={jobs ?? []}
        />

        {referralLink && (
          <ReferralCard
            referralLink={referralLink}
            referralCount={referralCount ?? 0}
            earnings={profile?.referral_earnings ?? 0}
          />
        )}

        <JobFeed jobs={jobs ?? []} resumeSkills={profile?.resume_skills ?? []} />
      </div>
    </main>
  );
}