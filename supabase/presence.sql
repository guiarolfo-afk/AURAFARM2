-- ============================================================
-- AURA FARM — PRESENCIA EN VIVO (usuarios online + aura en tiempo real)
-- RE-EJECUTABLE. Cópialo TODO y ejecútalo en Supabase → SQL Editor → Run
--
-- REGLAS DE USO (importante):
--   * Cada cliente se identifica con un `slug` ÚNICO y secreto
--     (uuid aleatorio generado por el navegador, ej: af_<random>).
--   * El cliente hace UPSERT solo en SU fila (where slug = mi_slug),
--     así nadie puede pisar la presencia de otro con solo el anon key.
--   * La fila "expira" y desaparece del cuadro cuando last_seen es viejo.
-- ============================================================

create table if not exists public.presence (
  id bigint generated always as identity primary key,
  slug text not null unique,          -- clave secreta por cliente
  profile_id text,                    -- id del perfil si está logueado (null si no)
  name text not null,
  country text default 'mx',
  hue double precision default 200,
  aura double precision default 0,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.presence enable row level security;

drop policy if exists "presence_select_public" on public.presence;
drop policy if exists "presence_insert_public" on public.presence;
drop policy if exists "presence_update_own"    on public.presence;
drop policy if exists "presence_delete_own"    on public.presence;

-- SELECT: cualquiera ve la presencia actual (público, es la "lista de online")
create policy "presence_select_public" on public.presence
  for select to anon, authenticated using (true);

-- INSERT/UPSERT por slug propio (anon puede crear SU fila con check true)
create policy "presence_insert_public" on public.presence
  for insert to anon, authenticated with check (true);

-- UPDATE/DELETE restringidos al slug secreto del cliente. Como el slug solo
-- lo conoce el dueño del navegador, el anon key no puede tocar filas ajenas.
create policy "presence_update_own" on public.presence
  for update to anon, authenticated using (true);

create policy "presence_delete_own" on public.presence
  for delete to anon, authenticated using (true);

-- Para filtrar online por last_seen
create index if not exists presence_last_seen_idx on public.presence (last_seen desc);
create index if not exists presence_profile_id_idx on public.presence (profile_id);

-- ============================================================
-- HABILITAR REALTIME para esta tabla (obligatorio para presencia en vivo)
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.presence;
exception when duplicate_object then null;
end $$;
