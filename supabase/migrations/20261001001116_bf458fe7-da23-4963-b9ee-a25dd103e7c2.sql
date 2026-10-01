ALTER TABLE public.gm7_active_tournaments
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS thumb_url text,
  ADD COLUMN IF NOT EXISTS slots integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS discord_url text,
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS podium jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prize_split jsonb NOT NULL DEFAULT '[60,30,10]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_notes text NOT NULL DEFAULT '';

UPDATE public.gm7_active_tournaments SET slots = bracket_size WHERE slots = 8 AND bracket_size <> 8;
UPDATE public.gm7_active_tournaments SET status = 'in_progress' WHERE status = 'open';
UPDATE public.gm7_active_tournaments SET status = 'active' WHERE status = 'live';
UPDATE public.gm7_active_tournaments SET status = 'completed' WHERE status = 'finished';
ALTER TABLE public.gm7_active_tournaments ALTER COLUMN status SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.gm7_tournament_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.gm7_active_tournaments(id) ON DELETE CASCADE,
  mode integer NOT NULL DEFAULT 1,
  team_name text NOT NULL DEFAULT '',
  captain_name text NOT NULL,
  phone text NOT NULL,
  discord text NOT NULL DEFAULT '',
  city text NOT NULL,
  platform_id text NOT NULL,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.gm7_tournament_registrations TO service_role;
ALTER TABLE public.gm7_tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS gm7_treg_tournament_idx ON public.gm7_tournament_registrations (tournament_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_gm7_treg_updated_at ON public.gm7_tournament_registrations;
CREATE TRIGGER update_gm7_treg_updated_at BEFORE UPDATE ON public.gm7_tournament_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();