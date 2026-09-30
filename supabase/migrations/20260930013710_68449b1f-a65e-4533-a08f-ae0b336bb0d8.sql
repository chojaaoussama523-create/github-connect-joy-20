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

CREATE TABLE public.gm7_active_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  game_id text NOT NULL,
  game_name text NOT NULL,
  platform text NOT NULL,
  mode int NOT NULL DEFAULT 1,
  format text NOT NULL DEFAULT 'knockout',
  bracket_size int NOT NULL DEFAULT 8,
  prize_mad numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  starts_at timestamptz,
  teams jsonb NOT NULL DEFAULT '[]',
  winners jsonb NOT NULL DEFAULT '[]',
  third text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gm7_active_tournaments TO anon, authenticated;
GRANT ALL ON public.gm7_active_tournaments TO service_role;
ALTER TABLE public.gm7_active_tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view tournaments" ON public.gm7_active_tournaments FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_mad numeric NOT NULL CHECK (price_mad >= 0),
  image_url text,
  stock int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_products TO anon, authenticated;
GRANT ALL ON public.market_products TO service_role;
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON public.market_products FOR SELECT TO anon, authenticated USING (active = true);

CREATE TABLE public.market_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL,
  subtotal_mad numeric NOT NULL,
  shipping_mad numeric NOT NULL DEFAULT 0,
  total_mad numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cod',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);
GRANT ALL ON public.market_orders TO service_role;
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.snnsei_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  kind text NOT NULL DEFAULT 'video',
  title text NOT NULL,
  url text NOT NULL,
  is_live boolean NOT NULL DEFAULT false,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.snnsei_media TO anon, authenticated;
GRANT ALL ON public.snnsei_media TO service_role;
ALTER TABLE public.snnsei_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view media" ON public.snnsei_media FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.market_products (title, description, price_mad, stock) VALUES
('GM7 ELITE HOODIE', 'هودي GM7 الرسمي بخامة فاخرة', 349, 25),
('GM7 PRO MOUSEPAD XL', 'ماوس باد احترافي بحجم كبير', 189, 40),
('GM7 GAMING CAP', 'كاسكيطة GM7 بتطريز ذهبي', 129, 30),
('SNNSEI T-SHIRT', 'تيشيرت SNNSEI الحصري', 199, 50);

INSERT INTO public.snnsei_media (platform, kind, title, url, is_live, sort) VALUES
('kick', 'live', 'SNNSEI LIVE على KICK', 'https://kick.com/snnsei', false, 1),
('youtube', 'live', 'قناة SNNSEI على YouTube', 'https://youtube.com/@snnsei', false, 2),
('tiktok', 'short', 'آخر مقاطع TikTok', 'https://www.tiktok.com/@snnsei_', false, 3),
('instagram', 'short', 'Reels على Instagram', 'https://www.instagram.com/snnseii', false, 4);