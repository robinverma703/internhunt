import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { notifyNewJobs } from "@/lib/telegram";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200);
}

function guessCategory(title = "") {
  const t = title.toLowerCase();
  if (/(frontend|react|next\.js|vue|angular)/.test(t)) return "Frontend";
  if (/(backend|node|django|rails|api)/.test(t)) return "Backend";
  if (/(full[\s-]?stack)/.test(t)) return "Full Stack";
  if (/(data|analytics|ml|machine learning|ai)/.test(t)) return "Data / AI";
  if (/(design|ui|ux)/.test(t)) return "Design";
  if (/(market|sales|growth|content)/.test(t)) return "Marketing";
  if (/(intern)/.test(t)) return "Internship";
  return "General";
}

const HARD_REJECT_PATTERNS = [
  /registration\s*fee/i,
  /security\s*deposit/i,
  /pay\s*(a\s*)?(small\s*)?fee/i,
  /refundable\s*deposit/i,
  /investment\s*required/i,
  /joining\s*fee/i,
  /whatsapp\s*only/i,
  /telegram\s*only/i,
];

type CandidateJob = {
  title: string;
  company: string;
  description: string;
  stipend: null;
  link: string;
  category: string;
  source: string;
  source_id: string;
  location: string | null;
};

function assessQuality(job: CandidateJob) {
  const text = `${job.title} ${job.description} ${job.company}`;
  for (const pattern of HARD_REJECT_PATTERNS) {
    if (pattern.test(text)) return { reject: true, flags: [] as string[] };
  }
  const flags: string[] = [];
  if (job.description.length < 150) {
    flags.push("Very short description — verify before approving");
  }
  return { reject: false, flags };
}

const INTERN_REGEX = /intern(ship)?/i;

const GREENHOUSE_COMPANIES = [
  "groww", "hackerrank", "earnin", "cloudsek", "miqdigital", "razorpay",
  "postman", "browserstack", "freshworks", "chargebee", "clevertap",
  "truecaller", "inmobi", "enterpret", "knowbe4", "khanacademy",
  "towerresearchcapital", "tide", "phonepe", "addepar1",
  "agoda", "karat", "successkpiinc", "mdbgeneralreferrals", "aspire",
];

async function fetchGreenhouse(): Promise<CandidateJob[]> {
  const results = await Promise.all(
    GREENHOUSE_COMPANIES.map(async (company) => {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json.jobs ?? [])
          .filter((j: any) => INTERN_REGEX.test(j.title))
          .map((j: any) => ({
            title: j.title,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            description: stripHtml(j.content || j.title),
            stipend: null,
            link: j.absolute_url,
            category: guessCategory(j.title),
            source: "greenhouse",
            source_id: String(j.id),
            location: j.location?.name ?? null,
          }));
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

const LEVER_COMPANIES = [
  "cars24", "spinny", "coindcx", "upstox", "zeta", "simpl", "vahan",
  "livspace", "wakefit", "curefoods", "rapido", "blinkit", "loco",
  "homelane", "milkbasket", "shiprocket", "khatabook", "moglix",
  "udaan", "cure-fit", "cultfit", "meesho", "vedantu", "unacademy",
  "eruditus", "springboard", "pristyncare", "yellowai", "hyperverge",
  "leena-ai", "innovaccer", "highradius", "darwinbox", "zenoti",
  "capillarytech", "freightify", "bewakoof", "fabindia",
  "atlassian", "fampay", "epifi",
];

async function fetchLever(): Promise<CandidateJob[]> {
  const results = await Promise.all(
    LEVER_COMPANIES.map(async (company) => {
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json ?? [])
          .filter((j: any) => INTERN_REGEX.test(j.text))
          .map((j: any) => ({
            title: j.text,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            description: stripHtml(j.descriptionPlain || j.text),
            stipend: null,
            link: j.hostedUrl,
            category: guessCategory(j.text),
            source: "lever",
            source_id: j.id,
            location: j.categories?.location ?? null,
          }));
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const [greenhouseJobs, leverJobs] = await Promise.all([
    fetchGreenhouse(),
    fetchLever(),
  ]);

  const allJobs = [...greenhouseJobs, ...leverJobs].filter(
    (j) => j.title && j.company && j.link
  );

  let rejectedCount = 0;
  let flaggedCount = 0;
  const cleanJobs: (CandidateJob & { flags: string[] })[] = [];

  for (const job of allJobs) {
    const { reject, flags } = assessQuality(job);
    if (reject) { rejectedCount++; continue; }
    if (flags.length > 0) flaggedCount++;
    cleanJobs.push({ ...job, flags });
  }

  const { data, error } = await supabase
    .from("job_staging")
    .upsert(cleanJobs, { onConflict: "source,source_id", ignoreDuplicates: true })
    .select();

 if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data && data.length > 0) {
    await notifyNewJobs(data.map((j) => ({ title: j.title, company: j.company })));
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    candidates: allJobs.length,
    rejected: rejectedCount,
    flagged: flaggedCount,
    newInStaging: data?.length ?? 0,
    message: `Done. ${data?.length ?? 0} new jobs added to staging. Go approve them from /admin.`,
  });
}