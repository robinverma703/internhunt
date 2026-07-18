import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const PUBLIC_PATHS = ["/", "/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/_next") || pathname.startsWith("/api/razorpay/webhook")
  );

  // 1. Not logged in -> only public paths allowed, everything else -> /login
  if (!user) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Logged in and hitting /login -> send to dashboard (guard decides premium)
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. Admin route -> must match ADMIN_EMAIL exactly
  if (pathname.startsWith("/admin")) {
    if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 4. Dashboard route -> must be premium
  if (pathname.startsWith("/dashboard")) {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    if (!data?.is_premium) {
      const url = request.nextUrl.clone();
      url.pathname = "/pay";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 5. Logged-in user visiting /pay while already premium -> dashboard
  if (pathname.startsWith("/pay")) {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    if (data?.is_premium) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image files, so the
     * guard covers every page and API route while staying fast.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
