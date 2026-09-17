import { createClient } from "@/lib/supabase/server";
import HackathonsShowcase from "@/components/hackathons-showcase";

export const dynamic = "force-dynamic";

export type HackathonRow = {
  id: string;
  title: string;
  organizer: string;
  description: string;
  mode: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  prize: string | null;
  category: string;
  link: string;
  created_at: string;
};

export default async function HackathonsPage() {
  const supabase = await createClient();
  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  return <HackathonsShowcase hackathons={(hackathons as HackathonRow[]) ?? []} />;
}