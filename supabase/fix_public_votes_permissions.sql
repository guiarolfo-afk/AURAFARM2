-- Fix public_votes permissions for anonymous access
-- Run this in Supabase Dashboard → SQL Editor

-- Ensure RLS is enabled
ALTER TABLE public.public_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_votes_select" ON public.public_votes;
DROP POLICY IF EXISTS "public_votes_insert" ON public.public_votes;

-- Grant SELECT permission to anon role (required for RLS to work with anon)
GRANT SELECT ON public.public_votes TO anon;
GRANT INSERT ON public.public_votes TO anon;

-- Policy: Anyone (anon + authenticated) can read public_votes (for live vote counts)
CREATE POLICY "public_votes_select" ON public.public_votes
  FOR SELECT TO anon, authenticated USING (true);

-- Policy: Anyone can insert/vote (upsert) - no FK validation needed
CREATE POLICY "public_votes_insert" ON public.public_votes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Also ensure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_votes;