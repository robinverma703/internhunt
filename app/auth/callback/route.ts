import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Link referrer on first login only (referred_by starts null)
      const cookieStore = await cookies();
      const refCode = cookieStore.get("referral_code")?.value;

      if (refCode) {
        const { data: existing } = await supabase
          .from("users")
          .select("referred_by")
          .eq("id", data.user.id)
          .single();

        if (existing && existing.referred_by === null) {
          const { data: referrer } = await supabase
            .from("users")
            .select("id")
            .eq("referral_code", refCode)
            .single();

          if (referrer && referrer.id !== data.user.id) {
            await supabase
              .from("users")
              .update({ referred_by: referrer.id })
              .eq("id", data.user.id);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}