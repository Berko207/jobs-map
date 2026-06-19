-- Optional Supabase schema for persisting saved/applied employer state.
-- Run this in the Supabase SQL editor if you enable cloud persistence.

create table if not exists public.user_companies (
  company_id text primary key,
  saved boolean not null default false,
  applied boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_companies enable row level security;

-- Demo policy: allow anonymous read/write for this single-user demo app.
-- Tighten this for production (e.g. auth.uid() = user_id).
create policy "anon read user_companies"
  on public.user_companies for select
  to anon
  using (true);

create policy "anon insert user_companies"
  on public.user_companies for insert
  to anon
  with check (true);

create policy "anon update user_companies"
  on public.user_companies for update
  to anon
  using (true)
  with check (true);

create policy "anon upsert user_companies"
  on public.user_companies for all
  to anon
  using (true)
  with check (true);
