-- Fix events table status check constraint to include 'finished'
-- Run this in Supabase Dashboard → SQL Editor

-- First, drop the existing check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add the new check constraint with all valid status values
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status IN ('upcoming', 'live', 'cancelled', 'finished'));