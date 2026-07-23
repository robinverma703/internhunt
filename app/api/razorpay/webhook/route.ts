import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { creditReferralReward } from "@/lib/referral";

// Configure this exact URL as the webhook endpoint in the Razorpay
// dashboard, subscribed to the `payment.captured` event, and set
// RAZORPAY_WEBHOOK_SECRET to the same secret configured there.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const userId: string | undefined = payment.notes?.user_id;

    if (userId) {
      const supabase = createServiceRoleClient();

      await supabase.from("payments").insert({
        user_id: userId,
        payment_id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: "paid",
      });

      await supabase.from("users").update({ is_premium: true }).eq("id", userId);
      await creditReferralReward(userId);
    }
  }

  return NextResponse.json({ received: true });
}