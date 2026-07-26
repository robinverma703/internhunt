import Razorpay from "razorpay";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Server-only. Never import this file from a client component.
export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Access lasts 7 days per purchase. First purchase is priced higher than
// every renewal after it (renewal = any repurchase once a user has at
// least one prior successful payment on record).
export const PREMIUM_DURATION_DAYS = 7;
export const FIRST_TIME_PRICE_PAISE =
  Number(process.env.PREMIUM_PRICE_INR ?? 49) * 100;
export const RENEWAL_PRICE_PAISE =
  Number(process.env.PREMIUM_RENEWAL_PRICE_INR ?? 29) * 100;

// Renewal pricing kicks in once the user has any successful payment on
// record, regardless of whether their access is currently active or lapsed.
export async function getPremiumPriceForUser(userId: string): Promise<{
  amountPaise: number;
  isRenewal: boolean;
}> {
  const supabase = createServiceRoleClient();
  const { count } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "paid");

  const isRenewal = (count ?? 0) > 0;
  return {
    amountPaise: isRenewal ? RENEWAL_PRICE_PAISE : FIRST_TIME_PRICE_PAISE,
    isRenewal,
  };
}