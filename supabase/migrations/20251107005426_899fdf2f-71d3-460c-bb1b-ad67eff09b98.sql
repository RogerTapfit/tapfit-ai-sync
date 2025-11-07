-- Allow users to view public profiles (for avatars in search/feed)
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_profile_public = true 
  AND username IS NOT NULL
);