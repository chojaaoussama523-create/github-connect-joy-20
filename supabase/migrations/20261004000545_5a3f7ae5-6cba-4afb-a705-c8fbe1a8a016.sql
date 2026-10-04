CREATE TABLE public.gm7_market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'topup',
  price numeric NOT NULL CHECK (price >= 0),
  image_url text,
  stock_status text NOT NULL DEFAULT 'in_stock',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gm7_market_products TO anon, authenticated;
GRANT ALL ON public.gm7_market_products TO service_role;
ALTER TABLE public.gm7_market_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view digital products" ON public.gm7_market_products FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.gm7_market_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.gm7_market_products(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  whatsapp_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  total_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.gm7_market_orders TO service_role;
ALTER TABLE public.gm7_market_orders ENABLE ROW LEVEL SECURITY;

INSERT INTO public.gm7_market_products (title, category, price, description) VALUES
('Free Fire 520 Diamonds','currency',55,'شحن مباشر بالـ ID'),
('PUBG Mobile 660 UC','currency',99,'شحن UC فوري'),
('PlayStation Gift Card 10$','giftcard',120,'بطاقة PSN'),
('Steam Wallet 20$','giftcard',220,'رصيد ستيم'),
('Mobile Legends 250 Diamonds','topup',45,'شحن فوري');