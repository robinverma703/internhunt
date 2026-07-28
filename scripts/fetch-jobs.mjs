import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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

function assessQuality(job) {
  const text = `${job.title} ${job.description} ${job.company}`;
  for (const pattern of HARD_REJECT_PATTERNS) {
    if (pattern.test(text)) return { reject: true, flags: [] };
  }
  const flags = [];
  if (job.description.length < 150) {
    flags.push("Very short description — verify before approving");
  }
  return { reject: false, flags };
}

const INTERN_REGEX = /intern(ship)?/i;

// ---------------------------------------------------------------
// GREENHOUSE — official company career pages.
// ---------------------------------------------------------------
const GREENHOUSE_COMPANIES = [
  "groww", "hackerrank", "earnin", "cloudsek", "miqdigital", "razorpay",
  "postman", "browserstack", "freshworks", "chargebee", "clevertap",
  "truecaller", "inmobi", "enterpret", "knowbe4", "khanacademy",
  "towerresearchcapital", "tide", "phonepe", "addepar1",
  "agoda", "karat", "successkpiinc", "mdbgeneralreferrals", "aspire",
];

async function fetchGreenhouse() {
  let allResults = [];
  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`);
      if (!res.ok) continue;
      const json = await res.json();
      const jobs = (json.jobs ?? [])
        .filter((j) => INTERN_REGEX.test(j.title))
        .map((j) => ({
          title: j.title,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          description: stripHtml(j.content || j.title),
          stipend: null,
          link: j.absolute_url,
          category: guessCategory(j.title),
          source: "greenhouse",
          source_id: String(j.id),
        }));
      if (jobs.length) console.log(`    Greenhouse (${company}): ${jobs.length} internships`);
      allResults = allResults.concat(jobs);
    } catch {
      // company doesn't use greenhouse, skip silently
    }
  }
  return allResults;
}

// ---------------------------------------------------------------
// LEVER — another official ATS.
// ---------------------------------------------------------------
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

async function fetchLever() {
  let allResults = [];
  for (const company of LEVER_COMPANIES) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
      if (!res.ok) continue;
      const json = await res.json();
      const jobs = (json ?? [])
        .filter((j) => INTERN_REGEX.test(j.text))
        .map((j) => ({
          title: j.text,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          description: stripHtml(j.descriptionPlain || j.text),
          stipend: null,
          link: j.hostedUrl,
          category: guessCategory(j.text),
          source: "lever",
          source_id: j.id,
        }));
      if (jobs.length) console.log(`    Lever (${company}): ${jobs.length} internships`);
      allResults = allResults.concat(jobs);
    } catch {
      // company doesn't use lever, skip silently
    }
  }
  return allResults;
}

async function main() {
  console.log("InternHunt AI Agent — fetching from official company career pages only...\n");

  console.log("Fetching Greenhouse companies...");
  const greenhouseJobs = await fetchGreenhouse();

  console.log("Fetching Lever companies...");
  const leverJobs = await fetchLever();

  const allJobs = [...greenhouseJobs, ...leverJobs].filter(
    (j) => j.title && j.company && j.link
  );

  console.log(`\nTotal candidate jobs: ${allJobs.length}`);
  console.log("Running quality filter...");

  let rejectedCount = 0;
  let flaggedCount = 0;
  const cleanJobs = [];

  for (const job of allJobs) {
    const { reject, flags } = assessQuality(job);
    if (reject) { rejectedCount++; continue; }
    if (flags.length > 0) flaggedCount++;
    cleanJobs.push({ ...job, flags });
  }

  console.log(`  -> ${rejectedCount} rejected as likely spam/scam`);
  console.log(`  -> ${flaggedCount} flagged (short description, verify before approving)`);
  console.log(`  -> ${cleanJobs.length} jobs going to staging\n`);

  console.log("Inserting into job_staging (duplicates are skipped automatically)...");
  const { data, error } = await supabase
    .from("job_staging")
    .upsert(cleanJobs, { onConflict: "source,source_id", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(`\nDone. ${data?.length ?? 0} NEW jobs added to staging for review.`);
  console.log("Go to /admin on your site to approve or reject them.");
}

main();