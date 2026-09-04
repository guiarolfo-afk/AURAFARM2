-- RLS policies for public_votes table
-- Execute this in Supabase SQL Editor

-- Permitir lectura pública de votos
DO $$ BEGIN
  CREATE POLICY "Allow public read votes"
  ON public_votes FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Permitir que anónimos inserten votos
DO $$ BEGIN
  CREATE POLICY "Allow public insert votes"
  ON public_votes FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Permitir que anónimos actualicen sus votos
DO $$ BEGIN
  CREATE POLICY "Allow public update votes"
  ON public_votes FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
