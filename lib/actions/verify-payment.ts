"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function verifyPaymentScreenshot(
  paymentId: string,
  screenshotUrl: string,
  utr: string,
  expectedAmountRupees: number
) {
  const admin = createServiceRoleClient();

  try {
    // Download the screenshot and convert to base64 so we can send it to the AI
    const imageRes = await fetch(screenshotUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

    // --- FRAUD CHECK: has this exact screenshot been used before? ---
    const screenshotHash = crypto
      .createHash("sha256")
      .update(Buffer.from(imageBuffer))
      .digest("hex");

    const { data: duplicate } = await admin
      .from("payments")
      .select("id")
      .eq("screenshot_hash", screenshotHash)
      .neq("id", paymentId)
      .maybeSingle();

    if (duplicate) {
      await admin
        .from("payments")
        .update({
          ai_status: "flagged",
          ai_reason: "This exact screenshot has already been used for a different payment — needs manual review.",
          screenshot_hash: screenshotHash,
        })
        .eq("id", paymentId);
      return;
    }

    const prompt = `This is a screenshot of a UPI payment confirmation. Check carefully:
1. Does it clearly show a SUCCESSFUL payment (not pending/failed)?
2. Does the amount shown match ₹${expectedAmountRupees} (small differences due to fees are okay, but it must not be a completely different amount)?
3. If a UTR / Transaction ID / Reference number is visible in the image, does it match this: "${utr}"? If NO transaction ID is visible anywhere in the screenshot (many UPI apps hide it on the main success screen), that is NOT a reason to reject — just note it wasn't visible and continue checking the other points.
4. Does the screenshot look genuine (a real UPI app screen), not edited or suspicious?

Reply with ONLY a JSON object, nothing else, in this exact format:
{"verified": true or false, "reason": "short explanation in plain English"}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Image } },
              ],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();
    console.log("Gemini response:", JSON.stringify(geminiData));
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    // Gemini sometimes wraps JSON in ```json ... ``` — strip that if present
    const cleanText = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    if (parsed.verified === true) {
      // Passed AI check — schedule auto-approval 90 seconds from now
      const autoApproveAt = new Date(Date.now() + 90 * 1000).toISOString();
      await admin
        .from("payments")
        .update({
          ai_status: "verified",
          ai_reason: parsed.reason ?? "Looks good",
          auto_approve_at: autoApproveAt,
          screenshot_hash: screenshotHash,
        })
        .eq("id", paymentId);
    } else {
      // Failed AI check — needs manual review, no auto-approve
      await admin
        .from("payments")
        .update({
          ai_status: "flagged",
          ai_reason: parsed.reason ?? "Could not verify — please check manually",
          screenshot_hash: screenshotHash,
        })
        .eq("id", paymentId);
    }
  } catch (err) {
    console.error("AI verification failed:", err);
    // If anything goes wrong (API error, bad response, etc.), leave it for manual review
    await admin
      .from("payments")
      .update({
        ai_status: "flagged",
        ai_reason: "Automatic check failed — needs manual review",
      })
      .eq("id", paymentId);
  }
}