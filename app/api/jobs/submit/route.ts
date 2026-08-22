import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Data / AI",
  "Design",
  "Marketing",
  "Product",
  "Internship",
  "General",
];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const company = String(body.company ?? "").trim();
  const description = String(body.description ?? "").trim();
  const link = String(body.link ?? "").trim();
  const stipend = String(body.stipend ?? "").trim() || null;
  const location = String(body.location ?? "").trim() || null;
  const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : "General";

  if (!title || !company || !description || !link) {
    return NextResponse.json(
      { error: "Title, company, description, and application link are required." },
      { status: 400 }
    );
  }

  if (title.length > 200 || company.length > 200) {
    return NextResponse.json({ error: "Title/company too long." }, { status: 400 });
  }

  if (!/^https?:\/\//i.test(link)) {
    return NextResponse.json(
      { error: "Application link must start with http:// or https://" },
      { status: 400 }
    );
  }

  const service = createServiceRoleClient();

  const { error } = await service.from("job_staging").insert({
    title,
    company,
    description,
    stipend,
    link,
    category,
    location,
    source: "company_submission",
    source_id: `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Thanks! Your listing has been submitted for review.",
  });
}