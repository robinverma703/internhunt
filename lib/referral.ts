import { createServiceRoleClient } from "@/lib/supabase/server";

// Credits ₹20 to whoever referred this user, the first time this user
// becomes premium. Safe to call multiple times — the unique constraint
// on referrals.referred_id (from the migration) prevents double-crediting.
export async function creditReferralReward(userId: string) {
  const supabase = createServiceRoleClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("referred_by")
    .eq("id", userId)
    .single();

  if (!userRow?.referred_by) return;

  const { error } = await supabase.from("referrals").insert({
    referrer_id: userRow.referred_by,
    referred_id: userId,
    reward_amount: 20,
  });

  // If insert failed because it already exists (unique constraint), skip.
  if (error) return;

  await supabase.rpc("increment_referral_earnings", {
    target_user_id: userRow.referred_by,
    amount: 20,
  });
}