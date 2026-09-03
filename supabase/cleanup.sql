-- ============================================================
-- AURA FARM — LIMPIEZA TOTAL DE DATOS DE PRUEBA (deja TODO en 0)
-- Cópialo TODO y ejecútalo en Supabase → SQL Editor → Run
-- Borra TODO el contenido de los datos de la app (eventos, usuarios,
-- participaciones, votos, colaboradores, calificaciones), en orden
-- correcto respetando las claves foráneas.
-- OJO: NO borra los usuarios de auth.users (para no romper el login
-- de la cuenta real); borra el contenido de la tabla profiles.
-- ============================================================

begin;

-- 1) Tablas hijas (las que referencian a events / profiles)
delete from public.public_votes;
delete from public.votes;
delete from public.organizer_ratings;
delete from public.event_collaborators;
delete from public.event_participants;

-- 2) Eventos
delete from public.events;

-- 3) Perfiles de usuario (contenido de usuarios registrados)
delete from public.profiles;

-- Reiniciar secuencias de identidad si alguna la usa (la mayoría usa uuid)
-- (no hay secuencias uuid; se deja por si existiera alguna tabla con serial)

commit;

-- Verificación opcional (debe devolver 0 en todas)
-- select (select count(*) from public.events)               as events,
--        (select count(*) from public.profiles)             as profiles,
--        (select count(*) from public.event_participants)   as participants,
--        (select count(*) from public.event_collaborators)  as collabs,
--        (select count(*) from public.votes)                as votes,
--        (select count(*) from public.public_votes)         as public_votes,
--        (select count(*) from public.organizer_ratings)    as ratings;
