import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = createServiceRoleClient();

  const nowIso = new Date().toISOString();

  // Find all payments whose auto-approve time has passed and are still waiting
  const { data: duePayments, error } = await admin
    .from("payments")
    .select("id, user_id")
    .eq("status", "submitted")
    .eq("ai_status", "verified")
    .lte("auto_approve_at", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!duePayments || duePayments.length === 0) {
    return NextResponse.json({ approved: 0 });
  }

  let approvedCount = 0;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  for (const payment of duePayments) {
    const { error: paymentError } = await admin
      .from("payments")
      .update({ status: "verified" })
      .eq("id", payment.id);

    if (paymentError) continue;

    const { error: userError } = await admin
      .from("users")
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq("id", payment.user_id);

    if (!userError) approvedCount++;
  }

  return NextResponse.json({ approved: approvedCount });
}