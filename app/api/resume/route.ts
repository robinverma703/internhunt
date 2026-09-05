import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function extractSkillsWithGemini(pdfBase64: string): Promise<{
  skills: string[];
  summary: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in .env.local");
  }

  const prompt = `You are reading a resume/CV PDF. Extract:
1. A flat list of concrete skills (technical skills, tools, languages, frameworks — NOT soft skills like "teamwork"). Keep each skill short (1-3 words), lowercase.
2. A 1-2 sentence professional summary of this candidate.

Respond with ONLY a single-line JSON object, no markdown, no code fences:
{"skills":["skill1","skill2",...],"summary":"..."}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      }),
    }
  );

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 40) : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch {
    throw new Error("Could not parse Gemini response as JSON");
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // 1. Upload PDF to private storage bucket
    const service = createServiceRoleClient();
    const storagePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await service.storage
      .from("resumes")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // 2. Ask Gemini to extract skills + summary
    let skills: string[] = [];
    let summary = "";
    try {
      const extracted = await extractSkillsWithGemini(base64);
      skills = extracted.skills;
      summary = extracted.summary;
    } catch (e: any) {
      return NextResponse.json(
        { error: `Resume uploaded, but AI extraction failed: ${e.message}` },
        { status: 500 }
      );
    }

    // 3. Save results to the user's profile
    const { error: dbError } = await service
      .from("users")
      .update({
        resume_url: storagePath,
        resume_filename: file.name,
        resume_skills: skills,
        resume_summary: summary,
        resume_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbError) {
      return NextResponse.json({ error: `DB update failed: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ skills, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}