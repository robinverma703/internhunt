"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approvePayment(paymentId: string, userId: string) {
  const admin = createServiceRoleClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: paymentError } = await admin
    .from("payments")
    .update({ status: "verified" })
    .eq("id", paymentId);

  if (paymentError) {
    return { error: "Payment update failed, try again" };
  }

  const { error: userError } = await admin
    .from("users")
    .update({
      is_premium: true,
      premium_expires_at: expiresAt.toISOString(),
    })
    .eq("id", userId);

  if (userError) {
    return { error: "User update failed, try again" };
  }

  revalidatePath("/admin");
  return { success: true };
}