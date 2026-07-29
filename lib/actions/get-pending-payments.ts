"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getPendingPayments() {
  const admin = createServiceRoleClient();

  const { data: payments, error } = await admin
    .from("payments")
    .select("*")
    .eq("status", "submitted")
    .order("created_at", { ascending: false });

  if (error || !payments) {
    return [];
  }

  // Har payment ke user_id se email nikalo (auth system se, users table se nahi)
  const enriched = await Promise.all(
    payments.map(async (payment) => {
      const { data: userData } = await admin.auth.admin.getUserById(payment.user_id);
      return {
        ...payment,
        userEmail: userData?.user?.email ?? "Unknown",
      };
    })
  );

  return enriched;
}