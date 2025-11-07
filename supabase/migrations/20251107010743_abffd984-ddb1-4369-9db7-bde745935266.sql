-- Allow anonymous (public) read access to public profiles for discovery/search
CREATE POLICY "Public profiles are viewable by anyone"
ON public.profiles
FOR SELECT
TO anon
USING (
  is_profile_public = true 
  AND username IS NOT NULL
);