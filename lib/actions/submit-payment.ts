"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitPayment(utr: string, amountRupees: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  const cleaned = utr.trim();
  if (cleaned.length < 6) {
    return { error: "Sahi UTR / Transaction ID daalo (UPI app ke payment history mein milega)" };
  }

  // Use service role so this insert isn't blocked by RLS (payments has no
  // client insert policy on purpose — this is the one controlled path in).
  const admin = createServiceRoleClient();

  const { error } = await admin.from("payments").insert({
    user_id: user.id,
    payment_id: cleaned,
    amount: amountRupees * 100,
    status: "submitted", // admin reviews this manually and flips user's is_premium
  });

  if (error) {
    return { error: "Kuch gadbad ho gayi, dobara try karo" };
  }

  revalidatePath("/pay");
  return { success: true };
}