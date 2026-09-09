-- ============================================================
-- AURA FARM — COLUMNA `features` EN EVENTS (Características del evento)
-- Ejecútalo en Supabase → SQL Editor → Run (idempotente)
-- Necesario para que la vista pública / enlaces compartidos
-- muestren las características del evento (stream, premios, comida…).
-- ============================================================

alter table public.events add column if not exists features text[] default '{}';