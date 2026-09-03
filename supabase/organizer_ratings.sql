-- ============================================================
-- AURA FARM — TABLA ORGANIZER_RATINGS + POLÍTICAS RLS
-- Cópialo TODO y ejecútalo en Supabase → SQL Editor → Run
-- Guarda la calificación (1-5) que cada usuario le da a un
-- organizador por cada evento. Se usa para mostrar la insignia
-- de organizador con su puntaje promedio en el perfil.
-- ============================================================

create table if not exists public.organizer_ratings (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles(id) on delete cascade,
  event_id text,
  rater_id uuid references public.profiles(id) on delete cascade null,
  anon_id text null,
  score integer not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (organizer_id, event_id, rater_id),
  unique (organizer_id, event_id, anon_id)
);

alter table public.organizer_ratings enable row level security;

drop policy if exists "org_ratings_select_public" on public.organizer_ratings;
drop policy if exists "org_ratings_insert_public" on public.organizer_ratings;
drop policy if exists "org_ratings_update_own"   on public.organizer_ratings;

create policy "org_ratings_select_public" on public.organizer_ratings
  for select to anon, authenticated using (true);
create policy "org_ratings_insert_public" on public.organizer_ratings
  for insert to anon, authenticated with check (true);
create policy "org_ratings_update_own" on public.organizer_ratings
  for update to authenticated using (rater_id = auth.uid());