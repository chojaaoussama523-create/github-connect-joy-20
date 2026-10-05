DROP POLICY IF EXISTS "Public can view media" ON public.snnsei_media;
DROP POLICY IF EXISTS "Public can view tournaments" ON public.gm7_active_tournaments;
REVOKE SELECT ON public.snnsei_media FROM anon, authenticated;
REVOKE SELECT ON public.gm7_active_tournaments FROM anon, authenticated;