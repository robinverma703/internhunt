-- ==========================================================
-- InternHunt — Resume Upload + AI Match Score
-- Run this in the Supabase SQL editor after schema.sql
-- ==========================================================

alter table public.users
  add column if not exists resume_url text,
  add column if not exists resume_filename text,
  add column if not exists resume_skills jsonb not null default '[]'::jsonb,
  add column if not exists resume_summary text,
  add column if not exists resume_updated_at timestamptz;

-- Storage bucket for resume PDFs (private — only owner + service role can read)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resume_owner_read"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "resume_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "resume_owner_update"
  on storage.objects for update
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "resume_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);