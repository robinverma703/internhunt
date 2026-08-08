import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return null;
  }
  return user;
}

export async function GET() {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceRoleClient();
  const { data, error } = await service
    .from("job_staging")
    .select("*")
    .eq("status", "pending")
    .order("scraped_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data });
}

export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const service = createServiceRoleClient();

  if (body.action === "reject_all") {
    const { error } = await service
      .from("job_staging")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("status", "pending");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const { id, action } = body;
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: staged, error: fetchError } = await service
    .from("job_staging")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !staged) {
    return NextResponse.json({ error: "Staging job not found" }, { status: 404 });
  }

  if (action === "reject") {
    const { error } = await service
      .from("job_staging")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { data: liveJob, error: insertError } = await service
    .from("jobs")
    .insert({
      title: staged.title,
      company: staged.company,
      description: staged.description,
      stipend: staged.stipend,
      link: staged.link,
      category: staged.category,
      location: staged.location ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await service
    .from("job_staging")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ job: liveJob });
}