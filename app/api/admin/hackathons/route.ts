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
    .from("hackathons_staging")
    .select("*")
    .eq("status", "pending")
    .order("scraped_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hackathons: data });
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
      .from("hackathons_staging")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("status", "pending");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "approve_all") {
    const { data: pending, error: fetchAllError } = await service
      .from("hackathons_staging")
      .select("*")
      .eq("status", "pending");

    if (fetchAllError) {
      return NextResponse.json({ error: fetchAllError.message }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ success: true, approved: 0 });
    }

    const { error: insertAllError } = await service.from("hackathons").insert(
      pending.map((staged) => ({
        title: staged.title,
        organizer: staged.organizer,
        description: staged.description,
        mode: staged.mode,
        location: staged.location,
        start_date: staged.start_date,
        end_date: staged.end_date,
        registration_deadline: staged.registration_deadline,
        prize: staged.prize,
        category: staged.category,
        link: staged.link,
      }))
    );

    if (insertAllError) {
      return NextResponse.json({ error: insertAllError.message }, { status: 500 });
    }

    const { error: updateAllError } = await service
      .from("hackathons_staging")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("status", "pending");

    if (updateAllError) {
      return NextResponse.json({ error: updateAllError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, approved: pending.length });
  }

  const { id, action } = body;
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: staged, error: fetchError } = await service
    .from("hackathons_staging")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !staged) {
    return NextResponse.json({ error: "Staging hackathon not found" }, { status: 404 });
  }

  if (action === "reject") {
    const { error } = await service
      .from("hackathons_staging")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { data: liveHackathon, error: insertError } = await service
    .from("hackathons")
    .insert({
      title: staged.title,
      organizer: staged.organizer,
      description: staged.description,
      mode: staged.mode,
      location: staged.location,
      start_date: staged.start_date,
      end_date: staged.end_date,
      registration_deadline: staged.registration_deadline,
      prize: staged.prize,
      category: staged.category,
      link: staged.link,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await service
    .from("hackathons_staging")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ hackathon: liveHackathon });
}