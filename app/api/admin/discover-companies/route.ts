import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
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

  const prompt = `You are helping identify which Applicant Tracking System (ATS) a company's careers site uses.

Company: "${companyName}" (India operations)

Search the web and figure out:
1. Which ATS platform their public job board runs on: "workday", "greenhouse", "lever", or "unknown" if you can't confirm.
2. The exact identifier needed to query it programmatically:
   - For Workday: the FULL careers site URL, e.g. "https://accenture.wd103.myworkdayjobs.com/AccentureCareers"
   - For Greenhouse: just the board token, e.g. "airbnb" (from boards.greenhouse.io/airbnb)
   - For Lever: just the company slug, e.g. "netflix" (from jobs.lever.co/netflix)
   - For unknown: null

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
          tools: [{ google_search: {} }],
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

export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const companies: string[] = body.companies ?? [];

  if (!Array.isArray(companies) || companies.length === 0) {
    return NextResponse.json({ error: "Provide { companies: string[] }" }, { status: 400 });
  }

  const batch = companies.slice(0, 8);

  const results: Discovery[] = [];
  for (const name of batch) {
    const result = await askGeminiAboutCompany(name);
    results.push(result);
  }

  const service = createServiceRoleClient();
  const { error } = await service.from("company_sources").upsert(
    results.map((r) => ({
      company: r.company,
      platform: r.platform,
      identifier: r.identifier,
      notes: r.notes,
      checked_at: new Date().toISOString(),
    })),
    { onConflict: "company" }
  );

  if (error) {
    return NextResponse.json({ error: error.message, results }, { status: 500 });
  }

  const found = results.filter((r) => r.platform !== "unknown" && r.identifier);

  return NextResponse.json({
    processed: results.length,
    found: found.length,
    remaining: companies.length - batch.length,
    results,
    message:
      companies.length > batch.length
        ? `Done with this batch. ${companies.length - batch.length} companies left — call again with the remaining names.`
        : "All companies in this list processed.",
  });
}

export async function GET() {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const service = createServiceRoleClient();
  const { data, error } = await service
    .from("company_sources")
    .select("*")
    .order("checked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data });
}