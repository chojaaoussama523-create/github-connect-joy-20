CREATE TABLE public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  team text NOT NULL,
  captain text NOT NULL,
  whatsapp text NOT NULL,
  discord text NOT NULL DEFAULT '',
  city text NOT NULL,
  platform text NOT NULL,
  game_id text NOT NULL,
  platform_id text NOT NULL,
  mode int NOT NULL,
  roster text[] NOT NULL DEFAULT '{}',
  sub text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tournament_registrations TO service_role;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;