-- Ensure user has a profile record
INSERT INTO public.profiles (id, tap_coins_balance, created_at)
SELECT 
  auth.uid(),
  0,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
);