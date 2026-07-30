import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const admin = createServiceRoleClient();

  // Get this user's most recent payment
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, ai_status, ai_reason, auto_approve_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ status: "none" });
  }

  // Already approved
  if (payment.status === "verified") {
    return NextResponse.json({ status: "approved" });
  }

  // AI flagged it as suspicious — needs manual review
  if (payment.ai_status === "flagged") {
    return NextResponse.json({
      status: "flagged",
      reason: payment.ai_reason ?? "Something didn't match — our team will check manually.",
    });
  }

  // AI verified it and it's waiting for the auto-approve timer — check if time is up
  if (payment.ai_status === "verified" && payment.auto_approve_at) {
    const now = new Date();
    const approveAt = new Date(payment.auto_approve_at);

    if (now >= approveAt) {
      // Time's up — approve it right now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await admin.from("payments").update({ status: "verified" }).eq("id", payment.id);
      await admin
        .from("users")
        .update({ is_premium: true, premium_expires_at: expiresAt.toISOString() })
        .eq("id", user.id);

      return NextResponse.json({ status: "approved" });
    }

    // Still waiting — tell the client how many seconds are left
    const secondsLeft = Math.max(0, Math.ceil((approveAt.getTime() - now.getTime()) / 1000));
    return NextResponse.json({ status: "waiting", secondsLeft });
  }

  // AI hasn't finished checking yet
  return NextResponse.json({ status: "checking" });
}