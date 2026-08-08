import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

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

function parseWorkdayUrl(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const tenant = host.split(".")[0];
    const site = u.pathname.split("/").filter(Boolean)[0];
    if (!tenant || !site) return null;
    return {
      apiUrl: `https://${host}/wday/cxs/${tenant}/${site}/jobs`,
      jobUrlBase: `https://${host}/${site}/job`,
    };
  } catch {
    return null;
  }
}

async function fetchWorkdayCompany(company: string, careersUrl: string) {
  const parsed = parseWorkdayUrl(careersUrl);
  if (!parsed) return [];

  try {
    const res = await fetch(parsed.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: "intern",
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const postings = json.jobPostings ?? [];

    return postings.map((p: any) => ({
      title: p.title,
      company,
      description: stripHtml(p.bulletFields?.join(" ") || p.title),
      stipend: null,
      link: `${parsed.jobUrlBase}${p.externalPath ?? ""}`,
      category: guessCategory(p.title),
      source: "workday",
      source_id: `${company}-${p.bulletFields?.[0] ?? p.title}`.slice(0, 190),
      location: p.locationsText ?? null,
    }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: sources, error: sourcesError } = await supabase
    .from("company_sources")
    .select("company, identifier")
    .eq("platform", "workday")
    .not("identifier", "is", null);

  if (sourcesError) {
    return NextResponse.json({ error: sourcesError.message }, { status: 500 });
  }

  if (!sources || sources.length === 0) {
    return NextResponse.json({
      message: "No Workday companies discovered yet. Run /api/admin/discover-companies first.",
      newInStaging: 0,
    });
  }

  const results = await Promise.all(
    sources.map((s) => fetchWorkdayCompany(s.company, s.identifier as string))
  );
  const allJobs = results.flat().filter((j) => j.title && j.link);

  const { data, error } = await supabase
    .from("job_staging")
    .upsert(
      allJobs.map((j) => ({ ...j, flags: [] })),
      { onConflict: "source,source_id", ignoreDuplicates: true }
    )
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    companiesChecked: sources.length,
    candidates: allJobs.length,
    newInStaging: data?.length ?? 0,
    message: `Done. ${data?.length ?? 0} new jobs added to staging from Workday companies.`,
  });
}