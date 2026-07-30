"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyPaymentScreenshot } from "@/lib/actions/verify-payment";

export async function submitPayment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  const utr = (formData.get("utr") as string) ?? "";
  const amountRupees = Number(formData.get("amount"));
  const screenshot = formData.get("screenshot") as File | null;

  const cleaned = utr.trim();
  if (cleaned.length < 6) {
    return { error: "Please enter a valid UTR / Transaction ID (found in your UPI app's payment history)" };
  }

  if (!screenshot) {
    return { error: "Please upload a screenshot of your payment success screen" };
  }

  const admin = createServiceRoleClient();

  // Check this UTR hasn't already been used by anyone
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("payment_id", cleaned)
    .maybeSingle();

  if (existing) {
    return { error: "This UTR has already been submitted. Please check and try again." };
  }

  // Upload screenshot to storage
  const fileExt = screenshot.name.split(".").pop() || "jpg";
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await admin.storage
    .from("payment-screenshots")
    .upload(fileName, screenshot, { contentType: screenshot.type });

  if (uploadError) {
    return { error: "Screenshot upload failed, please try again" };
  }

  const { data: publicUrlData } = admin.storage
    .from("payment-screenshots")
    .getPublicUrl(fileName);

  const screenshotUrl = publicUrlData.publicUrl;

  // Insert the payment record first (status: submitted, ai_status: pending)
  const { data: payment, error: insertError } = await admin
    .from("payments")
    .insert({
      user_id: user.id,
      payment_id: cleaned,
      amount: amountRupees * 100,
      status: "submitted",
      screenshot_url: screenshotUrl,
      ai_status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !payment) {
    return { error: "Something went wrong, please try again" };
  }

  // Run AI verification now (doesn't block user — errors here just leave it pending for manual review)
  try {
    await verifyPaymentScreenshot(payment.id, screenshotUrl, cleaned, amountRupees);
  } catch {
    // If AI check fails for any reason, it just stays pending for manual review
  }

  revalidatePath("/pay");
  revalidatePath("/admin");
  return { success: true };
}