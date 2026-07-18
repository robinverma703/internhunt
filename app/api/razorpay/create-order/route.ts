import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { razorpay, PREMIUM_PRICE_PAISE } from "@/lib/razorpay";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const order = await razorpay.orders.create({
    amount: PREMIUM_PRICE_PAISE,
    currency: "INR",
    receipt: `premium_${user.id}`,
    notes: { user_id: user.id, email: user.email ?? "" },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
