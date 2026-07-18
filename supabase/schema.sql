-- ==========================================================
-- InternHunt — Supabase schema, RLS policies, triggers
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ==========================================================

-- ----------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------
-- Table: users
-- Mirrors auth.users, adds app-specific fields (is_premium)
-- ----------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Users can read/update only their own row
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Row is created by the trigger below (SECURITY DEFINER), not by client inserts.

-- Auto-create a public.users row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------
-- Table: jobs
-- ----------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  company text not null,
  description text not null,
  stipend text,
  link text not null,
  category text not null default 'General',
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

-- Everyone (incl. anonymous) can browse job metadata — the `link` is
-- gated in the UI layer for non-premium users, but see note below on
-- optionally hiding `link` via a view for stricter server-side gating.
create policy "jobs_select_all"
  on public.jobs for select
  using (true);

-- Only the admin (matched by email) may insert/update/delete jobs
create policy "jobs_admin_write"
  on public.jobs for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.email = current_setting('app.admin_email', true)
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.email = current_setting('app.admin_email', true)
    )
  );

-- NOTE: Supabase does not let you set custom GUCs per-request easily from
-- the client, so in practice the admin check is enforced primarily in
-- `middleware.ts` and the `/api/admin/jobs` route (using the service-role
-- key), with this policy as defense-in-depth. Replace
-- `current_setting('app.admin_email', true)` with a hard-coded email
-- literal if you prefer enforcing it purely in Postgres, e.g.:
--   u.email = 'you@example.com'

-- ----------------------------------------------------------
-- Table: payments
-- ----------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  payment_id text not null,
  order_id text,
  amount integer,
  status text not null default 'created', -- created | paid | failed
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

-- Inserts/updates to payments happen only from the server (webhook route)
-- using the service-role key, which bypasses RLS by design. No client
-- insert/update policy is defined, so direct client writes are blocked.

-- ----------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------
create index if not exists jobs_category_idx on public.jobs (category);
create index if not exists jobs_created_at_idx on public.jobs (created_at desc);
create index if not exists payments_user_id_idx on public.payments (user_id);
