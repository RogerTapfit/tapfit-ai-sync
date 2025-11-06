-- Add username and social features to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS share_workout_stats boolean DEFAULT true;

-- Create index for username searches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON public.profiles USING gin(to_tsvector('english', COALESCE(username, '')));

-- Create user_follows table for social connections
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'muted')),
  
  -- Prevent duplicate follows and self-follows
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON public.user_follows(status);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows involving them"
  ON public.user_follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can view follows of public profiles"
  ON public.user_follows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = following_id AND is_profile_public = true
    )
  );

CREATE POLICY "Users can create their own follows"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Database function to get user social stats
CREATE OR REPLACE FUNCTION public.get_user_social_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'follower_count', (SELECT COUNT(*) FROM public.user_follows WHERE following_id = user_uuid AND status = 'active'),
    'following_count', (SELECT COUNT(*) FROM public.user_follows WHERE follower_id = user_uuid AND status = 'active'),
    'workout_count', (SELECT COUNT(*) FROM public.workout_logs WHERE user_id = user_uuid AND completed_at IS NOT NULL),
    'total_exercises', (SELECT COUNT(*) FROM public.exercise_logs WHERE user_id = user_uuid)
  );
$$;

-- Function to check if user follows another
CREATE OR REPLACE FUNCTION public.is_following(follower_uuid uuid, following_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_follows 
    WHERE follower_id = follower_uuid 
    AND following_id = following_uuid 
    AND status = 'active'
  );
$$;