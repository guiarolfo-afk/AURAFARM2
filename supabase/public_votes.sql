-- ============================================================
-- AURA FARM — tabla ligera para VOTOS ANÓNIMOS del PÚBLICO (FASE 6.1)
-- Permite que cualquier persona (sin cuenta) vote en vivo desde su móvil.
-- Los votos de usuarios con cuenta van a `votes` (FK a profiles).
-- Los votos del público anónimo van aquí, SIN FK, para no romper RLS.
-- Cópialo y ejecútalo en Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.public_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  anon_id text not null,               -- id anónimo del dispositivo
  target_user_id text,                 -- participante votado (uuid de profile o nombre)
  context text not null default 'general',
  score integer not null default 1,
  created_at timestamptz not null default now()
);

-- Un voto por dispositivo por objetivo por contexto (permite cambiar de voto vía upsert)
create unique index if not exists public_votes_uniq
  on public.public_votes (event_id, anon_id, target_user_id, context);

-- Realtime: el público y el organizador ven los conteos actualizarse en vivo
alter publication supabase_realtime add table public.public_votes;

-- ---- RLS ----
alter table public.public_votes enable row level security;

drop policy if exists "public_votes_select" on public.public_votes;
drop policy if exists "public_votes_insert" on public.public_votes;

-- Cualquiera (anon + authenticated) puede leer los votos anónimos (conteos en vivo)
create policy "public_votes_select" on public.public_votes
  for select to anon, authenticated using (true);

-- Cualquiera puede insertar/votar (upsert) — no hay FK que validar
create policy "public_votes_insert" on public.public_votes
  for insert to anon, authenticated with check (true);
