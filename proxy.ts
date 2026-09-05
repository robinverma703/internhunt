import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/about", "/faq"];
const PUBLIC_PREFIXES = ["/api/cron/", "/api/admin/discover-companies"];
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const { response, user } = await updateSession(request);

  // Track referral code from ?ref=CODE for 30 days
  const refCode = searchParams.get("ref");
  if (refCode) {
    response.cookies.set("referral_code", refCode, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/razorpay/webhook") ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

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

  // 4. Dashboard route -> currently free for everyone (payment gate disabled)
  if (pathname.startsWith("/dashboard")) {
    return response;
  }

  // 5. Pay page -> site is currently free, send everyone straight to dashboard
  if (pathname.startsWith("/pay")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};