import { createClient } from "@/lib/supabase/server";
import { getPremiumPriceForUser } from "@/lib/razorpay";
import PayCheckout from "@/components/pay-checkout";

export default async function PayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { amountPaise, isRenewal } = user
    ? await getPremiumPriceForUser(user.id)
    : { amountPaise: 4900, isRenewal: false };

  return <PayCheckout priceRupees={amountPaise / 100} isRenewal={isRenewal} />;
}