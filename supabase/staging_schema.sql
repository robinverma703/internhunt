create table if not exists public.job_staging (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  company text not null,
  description text not null,
  stipend text,
  link text not null,
  category text not null default 'General',
  source text not null,
  source_id text,
  status text not null default 'pending',
  scraped_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (source, source_id)
);

alter table public.job_staging enable row level security;

create policy "job_staging_admin_all"
  on public.job_staging for all
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

create index if not exists job_staging_status_idx on public.job_staging (status);
create index if not exists job_staging_scraped_at_idx on public.job_staging (scraped_at desc);