import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Called from the client right after Razorpay Checkout succeeds, purely to
// unlock the UI instantly. The webhook route is the authoritative source
// of truth (it can't be spoofed from the browser), this just avoids making
// the user wait on webhook delivery latency.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await request.json();

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  await admin.from("payments").insert({
    user_id: user.id,
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    status: "paid",
  });
  await admin.from("users").update({ is_premium: true }).eq("id", user.id);

  return NextResponse.json({ success: true });
}
