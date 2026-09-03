-- ============================================================
-- AURA FARM — HORARIO Y RESULTADO DEL EVENTO (FASE 6.x)
-- Añade: hora de fin, ganador del evento y aura ganada
-- Cópialo TODO y ejecútalo en Supabase → SQL Editor → Run
-- ============================================================

alter table public.events add column if not exists event_end_time text;
alter table public.events add column if not exists winner text;
alter table public.events add column if not exists winner_aura integer default 0;

-- Índice opcional por fecha para el orden de próximos eventos
create index if not exists events_date_iso_idx on public.events (date_iso);
