"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSearch(params: {
  keywords: string;
  category: string;
  city: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };  
  }

  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    keywords: params.keywords || null,
    category: params.category === "All" ? null : params.category,
    city: params.city === "All Cities" ? null : params.city,
  });

  if (error) {  
    return { error: error.message };
  }  

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSavedSearch(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };  
  }

  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markSearchSeen(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("saved_searches") 
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}