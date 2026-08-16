import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { notifyNewJobs } from "@/lib/telegram";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const BATCH_SIZE = 5;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

function stripHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0 },
        }),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? null;
  } catch {
    return null;
  }
}

async function findCareersUrl(company: string): Promise<string | null> {
  const text = await callGemini(
    `What is the most likely careers/jobs page URL for the company "${company}" (India operations)? ` +
      `Respond with ONLY the URL, nothing else. If you don't know, respond with exactly: unknown`
  );
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.toLowerCase().includes("unknown")) return null;
  const match = trimmed.match(/https?:\/\/[^\s"']+/);
  return match ? match[0] : null;
}

async function extractJobsFromPage(company: string, pageText: string) {
  const text = await callGemini(
    `Here is text scraped from "${company}"'s careers page. Extract any INTERNSHIP job postings ` +
      `you can find. For each, give a short title and, if visible in the text, a direct application link ` +
      `(if no specific link is visible, use null).\n\n` +
      `Respond with ONLY a JSON array, no markdown: [{"title":"...","link":"..." or null}]\n` +
      `If there are no internship postings visible, respond with: []\n\n` +
      `PAGE TEXT:\n${pageText.slice(0, 6000)}`
  );
  if (!text) return [];
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((j: any) => j && j.title);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: candidates, error: readError } = await supabase
    .from("company_sources")
    .select("company")
    .eq("platform", "unknown")
    .is("generic_checked_at", null)
    .limit(BATCH_SIZE);

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({
      message: "No unknown companies left to try the generic extractor on.",
      newInStaging: 0,
    });
  }

  const allJobs: any[] = [];
  const companyNamesChecked: string[] = [];

  for (const c of candidates) {
    companyNamesChecked.push(c.company);
    const careersUrl = await findCareersUrl(c.company);
    if (!careersUrl) continue;

    try {
      const pageRes = await fetch(careersUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; InternHuntBot/1.0)" },
      });
      if (!pageRes.ok) continue;
      const html = await pageRes.text();
      const pageText = stripHtml(html);
      if (pageText.length < 200) continue;

      const jobs = await extractJobsFromPage(c.company, pageText);
      for (const j of jobs) {
        allJobs.push({
          title: j.title,
          company: c.company,
          description: `Found on ${c.company}'s careers page. Please verify details before approving.`,
          stipend: null,
          link: j.link || careersUrl,
          category: guessCategory(j.title),
          source: "generic",
          source_id: `${c.company}-${j.title}`.slice(0, 190),
          location: null,
          flags: ["Auto-extracted from company website — verify carefully before approving"],
        });
      }
    } catch {
      continue;
    }
  }

  await supabase
    .from("company_sources")
    .update({ generic_checked_at: new Date().toISOString() })
    .in("company", companyNamesChecked);

  let newInStaging = 0;
  if (allJobs.length > 0) {
    const { data, error } = await supabase
      .from("job_staging")
      .upsert(allJobs, { onConflict: "source,source_id", ignoreDuplicates: true })
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    newInStaging = data?.length ?? 0;
    if (data && data.length > 0) {
      await notifyNewJobs(data.map((j) => ({ title: j.title, company: j.company })));
    }
  }

  return NextResponse.json({
    companiesChecked: companyNamesChecked,
    candidatesFound: allJobs.length,
    newInStaging,
    message: `Checked ${companyNamesChecked.length} companies via generic extraction. ${newInStaging} new jobs added to staging.`,
  });
}