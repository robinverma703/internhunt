# InternHunt

A premium, fast internship & job aggregator. Next.js 15 (App Router) + Tailwind
+ Shadcn-style UI + Framer Motion, backed by Supabase (auth, DB, RLS) and
Razorpay (₹99 one-time unlock).

## Stack

- **Framework:** Next.js 15, App Router, TypeScript
- **Styling:** Tailwind CSS + hand-rolled Shadcn-style primitives (`components/ui`)
- **Motion:** Framer Motion — custom cursor, page transitions, hover micro-interactions
- **Backend:** Supabase (Postgres, Auth via Google OAuth, Row Level Security)
- **Payments:** Razorpay (Orders API + webhook)
- **Hosting:** Vercel

## 1. Install

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` — see below for where each value comes from.

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the `Project URL`, `anon public` key,
   and `service_role` key into `.env.local`.
3. In **Authentication → Providers**, enable **Google** and fill in your
   Google OAuth client ID/secret (from Google Cloud Console). Add
   `http://localhost:3000/auth/callback` and your production URL's
   `/auth/callback` as authorized redirect URIs on both the Google client
   and inside Supabase's provider settings.
4. Open the **SQL Editor** and run the contents of `supabase/schema.sql`.
   This creates `users`, `jobs`, `payments`, RLS policies, and the trigger
   that auto-creates a `users` row on signup.
5. Set `ADMIN_EMAIL` in `.env.local` to the Google account that should have
   access to `/admin`. This is enforced in `middleware.ts` and again in
   `app/api/admin/jobs/route.ts`.

> The `jobs_admin_write` RLS policy references a Postgres setting
> (`app.admin_email`) that isn't trivial to set per-request from the
> client SDK. In practice, admin writes go through the service-role key
> in the API route, which bypasses RLS — the policy is there as
> defense-in-depth. If you want it enforced purely in Postgres, replace
> the `current_setting(...)` check in `supabase/schema.sql` with a
> hard-coded email literal.

## 3. Razorpay setup

1. Create a Razorpay account, grab your **Key ID** and **Key Secret** from
   **Settings → API Keys**.
2. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. In **Settings → Webhooks**, add an endpoint pointing to
   `https://<your-domain>/api/razorpay/webhook`, subscribed to the
   `payment.captured` event. Copy the webhook secret into
   `RAZORPAY_WEBHOOK_SECRET`.
4. `PREMIUM_PRICE_INR` controls the unlock price (defaults to 99).

Payment flow: `/pay` creates an order server-side → opens Razorpay
Checkout client-side → on success, calls `/api/razorpay/verify` for an
instant UI unlock → the `payment.captured` webhook is the source of truth
and flips `is_premium` independently, so the account stays correct even if
the browser tab closes before `verify` runs.

## 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com/new](https://vercel.com/new).
3. Add all variables from `.env.local` to the Vercel project's
   Environment Variables (set `NEXT_PUBLIC_SITE_URL` to your production
   domain).
4. Update the Google OAuth redirect URI and the Razorpay webhook URL to
   point at your production domain.
5. Deploy.

## Folder structure

```
app/
  page.tsx               Landing page
  login/page.tsx          Google OAuth sign-in
  auth/callback/route.ts  OAuth code exchange
  pay/page.tsx             Razorpay checkout (₹99 unlock)
  dashboard/page.tsx       Protected, SSR job feed (premium only)
  admin/page.tsx           Protected job-management panel (admin only)
  api/razorpay/            create-order, verify, webhook routes
  api/admin/jobs/          admin job CRUD route
middleware.ts              Central auth/premium/admin route guard
lib/supabase/               browser/server/service-role Supabase clients
components/                 Navbar, Hero, JobCard, JobFeed, CustomCursor, FAB, ui/*
supabase/schema.sql          Tables, RLS policies, triggers
```

## Security notes

- `middleware.ts` is the single point of truth for route access: it
  redirects unauthenticated users to `/login`, non-premium users away
  from `/dashboard` to `/pay`, and enforces `ADMIN_EMAIL` on `/admin`.
- All writes to `jobs` and `payments` from trusted server code use the
  **service-role key**, never exposed to the client.
- The Razorpay webhook verifies the `x-razorpay-signature` header with a
  timing-safe comparison before trusting any payload.
- RLS is enabled on every table; clients can only ever read their own
  `users` and `payments` rows.
