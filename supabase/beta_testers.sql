-- ============================================================
-- AURA FARM — tabla BETA_TESTERS para reclutar testers de Google Play
-- Cualquier persona puede dejar su email desde el banner y ser
-- contactada antes del lanzamiento oficial.
-- Cópialo TODO y ejecútalo en Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.beta_testers (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text,
  submitted_at timestamptz not null default now(),
  platform text not null default 'web',
  status text not null default 'pending'
);

alter table public.beta_testers enable row level security;

drop policy if exists "beta_testers_insert_public" on public.beta_testers;

-- Cualquiera (anon + authenticated) puede apuntarse como tester
create policy "beta_testers_insert_public" on public.beta_testers
  for insert to anon, authenticated with check (true);