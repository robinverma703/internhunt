import Razorpay from "razorpay";

// Server-only. Never import this file from a client component.
export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const PREMIUM_PRICE_PAISE =
  Number(process.env.PREMIUM_PRICE_INR ?? 99) * 100;
