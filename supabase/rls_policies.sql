-- ============================================================
-- AURA FARM — POLÍTICAS RLS COMPLETAS (5 tablas) — RE-EJECUTABLE
-- Cópialo TODO y ejecútalo en Supabase → SQL Editor → Run
-- Colaboradores: SOLO el dueño (auth.uid() == owner_id)
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_insert_own"    on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;

create policy "profiles_select_public" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to anon, authenticated with check (auth_id = auth.uid() or auth_id is null);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth_id = auth.uid()) with check (auth_id = auth.uid());

-- EVENTS
alter table public.events enable row level security;
drop policy if exists "events_select_public" on public.events;
drop policy if exists "events_insert_own"    on public.events;
drop policy if exists "events_update_own"    on public.events;
drop policy if exists "events_delete_own"    on public.events;

create policy "events_select_public" on public.events
  for select to anon, authenticated using (true);
create policy "events_insert_own" on public.events
  for insert to anon, authenticated with check (true);
create policy "events_update_own" on public.events
  for update to anon, authenticated using (true);
create policy "events_delete_own" on public.events
  for delete to anon, authenticated using (true);

-- EVENT_PARTICIPANTS
alter table public.event_participants enable row level security;
drop policy if exists "participants_select_public" on public.event_participants;
drop policy if exists "participants_insert_own"    on public.event_participants;

create policy "participants_select_public" on public.event_participants
  for select to anon, authenticated using (true);
create policy "participants_insert_own" on public.event_participants
  for insert to anon, authenticated with check (true);

-- EVENT_COLLABORATORS (owner + colaborador por email)
alter table public.event_collaborators add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.event_collaborators enable row level security;

drop policy if exists "collabs_select_public" on public.event_collaborators;
drop policy if exists "collabs_insert_own"    on public.event_collaborators;
drop policy if exists "collabs_update_own"    on public.event_collaborators;
drop policy if exists "collabs_delete_own"    on public.event_collaborators;
drop policy if exists "collabs_select_owner"  on public.event_collaborators;
drop policy if exists "collabs_insert_owner"  on public.event_collaborators;
drop policy if exists "collabs_update_owner"  on public.event_collaborators;
drop policy if exists "collabs_delete_owner"  on public.event_collaborators;

-- SELECT: el dueño ve su lista; el colaborador (por email) ve SU propia fila
create policy "collabs_select_owner" on public.event_collaborators
  for select to authenticated
  using (owner_id = auth.uid() or lower(coalesce(collaborator_email,'')) = lower(coalesce(auth.jwt()->>'email','')));
create policy "collabs_insert_owner" on public.event_collaborators
  for insert to authenticated with check (owner_id = auth.uid());
create policy "collabs_update_owner" on public.event_collaborators
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "collabs_delete_owner" on public.event_collaborators
  for delete to authenticated using (owner_id = auth.uid());

-- VOTES
alter table public.votes enable row level security;
drop policy if exists "votes_select_public" on public.votes;
drop policy if exists "votes_upsert_own"    on public.votes;
drop policy if exists "votes_update_own"    on public.votes;

create policy "votes_select_public" on public.votes
  for select to anon, authenticated using (true);
create policy "votes_upsert_own" on public.votes
  for insert to anon, authenticated with check (true);
create policy "votes_update_own" on public.votes
  for update to authenticated using (voter_id = auth.uid());

-- PUBLIC_VOTES (votos anónimos del público — FASE 6.1)
alter table public.public_votes enable row level security;
drop policy if exists "public_votes_select" on public.public_votes;
drop policy if exists "public_votes_insert" on public.public_votes;

create policy "public_votes_select" on public.public_votes
  for select to anon, authenticated using (true);
create policy "public_votes_insert" on public.public_votes
  for insert to anon, authenticated with check (true);

-- ORGANIZER_RATINGS (calificaciones al organizador de eventos)
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
