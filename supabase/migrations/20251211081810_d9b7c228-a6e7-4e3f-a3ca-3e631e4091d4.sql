-- Add RLS policy to allow viewing gamer stats for public profiles
CREATE POLICY "Users can view gamer stats for public profiles"
ON public.user_gamer_stats FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_gamer_stats.user_id 
    AND p.is_profile_public = true
  )
);