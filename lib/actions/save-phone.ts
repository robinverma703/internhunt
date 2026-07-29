"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function savePhone(phone: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  const cleaned = phone.trim();
  if (!/^\d{10}$/.test(cleaned)) {
    return { error: "Sahi 10 digit ka number daalo" };
  }

  const { error } = await supabase
    .from("users")
    .update({ phone: cleaned })
    .eq("id", user.id);

  if (error) {
    return { error: "Kuch gadbad ho gayi, dobara try karo" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}