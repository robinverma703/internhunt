-- ==========================================================
-- InternHunt — Saved Searches / Job Alerts (lightweight)
-- Run this in the Supabase SQL editor after resume_schema.sql
-- ==========================================================

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  keywords text,
  category text,
  city text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists saved_searches_user_id_idx on public.saved_searches(user_id);

alter table public.saved_searches enable row level security;

create policy "saved_searches_select_own"
  on public.saved_searches for select
  using (auth.uid() = user_id);

create policy "saved_searches_insert_own"
  on public.saved_searches for insert
  with check (auth.uid() = user_id);

create policy "saved_searches_update_own"
  on public.saved_searches for update
  using (auth.uid() = user_id);

create policy "saved_searches_delete_own"
  on public.saved_searches for delete
  using (auth.uid() = user_id);