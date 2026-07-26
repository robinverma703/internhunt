import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getPremiumPriceForUser, PREMIUM_DURATION_DAYS } from "@/lib/razorpay";
import PayCheckout from "@/components/pay-checkout";

export default async function PayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Owner bypass: the site owner (ADMIN_EMAIL) never has to pay to test
  // premium features. This check is server-side only and compares against
  // an env var, so it can't be spoofed from the browser.
  if (user && user.email === process.env.ADMIN_EMAIL) {
    const admin = createServiceRoleClient();
    const premiumExpiresAt = new Date(
      Date.now() + PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    await admin
      .from("users")
      .update({ is_premium: true, premium_expires_at: premiumExpiresAt })
      .eq("id", user.id);

    redirect("/dashboard");
  }

  const { amountPaise, isRenewal } = user
    ? await getPremiumPriceForUser(user.id)
    : { amountPaise: 4900, isRenewal: false };

  return <PayCheckout priceRupees={amountPaise / 100} isRenewal={isRenewal} />;
}