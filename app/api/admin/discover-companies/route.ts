import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { COMPANIES_TO_DISCOVER } from "@/lib/company-discovery-list";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

type Discovery = {
  company: string;
  platform: "workday" | "greenhouse" | "lever" | "unknown";
  identifier: string | null;
  notes: string | null;
};

async function askGeminiAboutCompany(companyName: string): Promise<Discovery> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { company: companyName, platform: "unknown", identifier: null, notes: "No GEMINI_API_KEY set" };
  }

  const prompt = `You are helping identify which Applicant Tracking System (ATS) a company's careers site uses, based on what you already know (you do not have live web access right now).

Company: "${companyName}" (India operations)

From your training knowledge, figure out:
1. Which ATS platform their public job board runs on: "workday", "greenhouse", "lever", or "unknown" if you're not confident.
2. The exact identifier needed to query it programmatically:
   - For Workday: the FULL careers site URL, e.g. "https://accenture.wd103.myworkdayjobs.com/AccentureCareers"
   - For Greenhouse: just the board token, e.g. "airbnb" (from boards.greenhouse.io/airbnb)
   - For Lever: just the company slug, e.g. "netflix" (from jobs.lever.co/netflix)
   - For unknown: null

If you are not reasonably confident, say "unknown" rather than guessing — a wrong URL is worse than no answer.

Respond with ONLY a single-line JSON object, no markdown, no explanation:
{"platform":"workday|greenhouse|lever|unknown","identifier":"..." or null,"notes":"short note or null"}`;

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

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      return {
        company: companyName,
        platform: "unknown",
        identifier: null,
        notes: `Gemini HTTP ${res.status}: ${bodyText.slice(0, 200)}`,
      };
    }

    const json = await res.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { company: companyName, platform: "unknown", identifier: null, notes: "Could not parse AI response" };
    }

    const parsed = JSON.parse(match[0]);
    const platform = ["workday", "greenhouse", "lever"].includes(parsed.platform)
      ? parsed.platform
      : "unknown";

    return {
      company: companyName,
      platform,
      identifier: parsed.identifier ?? null,
      notes: parsed.notes ?? null,
    };
  } catch (err: any) {
    return { company: companyName, platform: "unknown", identifier: null, notes: `Error: ${err.message}` };
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: alreadyChecked, error: readError } = await supabase
    .from("company_sources")
    .select("company");

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const checkedSet = new Set((alreadyChecked ?? []).map((c) => c.company));
  const remaining = COMPANIES_TO_DISCOVER.filter((c) => !checkedSet.has(c));

  if (remaining.length === 0) {
    return NextResponse.json({
      message: "All companies in the list have been checked already.",
      totalCompanies: COMPANIES_TO_DISCOVER.length,
      remaining: 0,
    });
  }

  const batch = remaining.slice(0, BATCH_SIZE);

  const results: Discovery[] = [];
  for (const name of batch) {
    const result = await askGeminiAboutCompany(name);
    results.push(result);
  }

  const { error: writeError } = await supabase.from("company_sources").upsert(
    results.map((r) => ({
      company: r.company,
      platform: r.platform,
      identifier: r.identifier,
      notes: r.notes,
      checked_at: new Date().toISOString(),
    })),
    { onConflict: "company" }
  );

  if (writeError) {
    return NextResponse.json({ error: writeError.message, results }, { status: 500 });
  }

  const found = results.filter((r) => r.platform !== "unknown" && r.identifier);

  return NextResponse.json({
    processedThisRun: results.length,
    foundThisRun: found.length,
    totalCompanies: COMPANIES_TO_DISCOVER.length,
    remainingAfterThisRun: remaining.length - batch.length,
    results,
    message: `Checked ${results.length} companies, found ${found.length} usable. ${
      remaining.length - batch.length
    } companies still left — will continue automatically tomorrow.`,
  });
}