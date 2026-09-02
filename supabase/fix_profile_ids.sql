-- ============================================================
-- AURA FARM — FIX DEFINITIVO: profiles.id = auth.uid()
-- Método a prueba de todo: guarda y desactiva las FKs que apuntan
-- a profiles(id), migra perfiles + hijas, y luego reactiva las FKs.
-- Ejecútalo completo en Supabase → SQL Editor → Run.
-- ============================================================

begin;

-- ---------- 0) BACKUP ----------
create table if not exists public._bk_profiles as select * from public.profiles;
create table if not exists public._bk_events as select * from public.events;
create table if not exists public._bk_event_participants as select * from public.event_participants;
create table if not exists public._bk_event_collaborators as select * from public.event_collaborators;
create table if not exists public._bk_votes as select * from public.votes;

-- ---------- 1) GUARDAR y DESACTIVAR las FKs que referencian profiles(id) ----------
create temp table _fks_to_disable on commit drop as
select
  conrelid::regclass::text            as tbl,
  conname                             as con,
  pg_get_constraintdef(oid)           as def
from pg_constraint
where contype = 'f'
  and confrelid = 'public.profiles'::regclass
  and confkey is not null
  and conkey is not null;

-- Importante: ejecutamos el DROP de cada FK identificada.
do $$
declare r record;
begin
  for r in select * from _fks_to_disable loop
    execute format('alter table %I drop constraint %I', r.tbl, r.con);
  end loop;
end $$;

-- ---------- 2) LIMPIAR HUÉRFANOS ANTES DE MIGRAR (evita poner NULL) ----------
delete from public.event_participants ep
where ep.user_id is null
   or not exists (select 1 from public.profiles p where p.id = ep.user_id);
delete from public.event_collaborators ec
where ec.owner_id is null
   or not exists (select 1 from public.profiles p where p.id = ec.owner_id);
delete from public.votes v
where v.voter_id is null
   or not exists (select 1 from public.profiles p where p.id = v.voter_id)
   or v.target_user_id is null
   or not exists (select 1 from public.profiles p where p.id = v.target_user_id);

-- ---------- 3) MIGRAR HIJAS: id viejo -> auth_id (solo si auth_id no es null) ----------
update public.events e
set organizer_id = p.auth_id
from public.profiles p
where e.organizer_id = p.id and e.organizer_id is not null and p.auth_id is not null;

update public.event_participants ep
set user_id = p.auth_id
from public.profiles p
where ep.user_id = p.id and p.auth_id is not null;

update public.event_collaborators ec
set owner_id = p.auth_id
from public.profiles p
where ec.owner_id = p.id and p.auth_id is not null;

update public.votes v
set voter_id = p.auth_id
from public.profiles p
where v.voter_id = p.id and p.auth_id is not null;

update public.votes v
set target_user_id = p.auth_id
from public.profiles p
where v.target_user_id = p.id and p.auth_id is not null;

-- Dedupe de votos
with dup as (
  select ctid,
    row_number() over (partition by event_id, voter_id, target_user_id, context order by ctid desc) as rn
  from public.votes
)
delete from public.votes v using dup d where v.ctid = d.ctid and d.rn > 1;

-- ---------- 4) LIMPIAR HUÉRFANOS (post-migración) ----------
delete from public.event_participants ep
where not exists (select 1 from public.profiles p where p.id = ep.user_id);
delete from public.event_collaborators ec
where not exists (select 1 from public.profiles p where p.id = ec.owner_id);
delete from public.votes v
where not exists (select 1 from public.profiles p where p.id = v.voter_id)
   or not exists (select 1 from public.profiles p where p.id = v.target_user_id);
delete from public.events e
where e.organizer_id is not null
  and not exists (select 1 from public.profiles p where p.id = e.organizer_id);

-- ---------- 4) BORRAR PERFILES HUÉRFANOS (sin cuenta) ----------
delete from public.profiles where auth_id is null;

-- ---------- 5) DEDUPE DE PERFILES (conservar uno por auth_id) ----------
with ranked as (
  select id, auth_id,
    row_number() over (partition by auth_id order by (id = auth_id) desc, id asc) as rn
  from public.profiles
  where auth_id is not null
)
delete from public.profiles p using ranked r where p.id = r.id and r.rn > 1;

-- ---------- 6) profiles.id = auth_id ----------
update public.profiles
set id = auth_id
where auth_id is not null and id is distinct from auth_id;

-- ---------- 7) REACTIVAR las FKs que guardamos ----------
do $$
declare r record;
begin
  for r in select * from _fks_to_disable loop
    execute format('alter table %I add constraint %I %s', r.tbl, r.con, r.def);
  end loop;
end $$;

-- ---------- 8) TRIGGER para futuras inserciones ----------
CREATE OR REPLACE FUNCTION public.set_profile_id_from_auth()
RETURNS trigger AS $$
BEGIN
  IF NEW.auth_id IS NOT NULL THEN
    NEW.id := NEW.auth_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

drop trigger if exists trg_profile_id_from_auth on public.profiles;
create trigger trg_profile_id_from_auth
before insert on public.profiles
for each row
execute procedure public.set_profile_id_from_auth();

commit;
