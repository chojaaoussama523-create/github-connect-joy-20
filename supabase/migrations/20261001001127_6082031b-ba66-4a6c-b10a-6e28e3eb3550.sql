DROP POLICY IF EXISTS "Registrations are admin-only" ON public.gm7_tournament_registrations;
CREATE POLICY "Registrations are admin-only"
ON public.gm7_tournament_registrations
FOR SELECT
TO authenticated
USING (false);