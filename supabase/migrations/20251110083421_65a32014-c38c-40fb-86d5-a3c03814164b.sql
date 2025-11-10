-- Update activity_feed table to support meal activities
ALTER TABLE public.activity_feed 
DROP CONSTRAINT IF EXISTS activity_feed_activity_type_check;

ALTER TABLE public.activity_feed 
ADD CONSTRAINT activity_feed_activity_type_check 
CHECK (activity_type IN ('pr', 'achievement', 'workout_milestone', 'streak_milestone', 'meal_logged', 'restaurant_meal', 'alcohol_logged'));

-- Update activity_reactions to support meal target type
ALTER TABLE public.activity_reactions 
DROP CONSTRAINT IF EXISTS activity_reactions_target_type_check;

ALTER TABLE public.activity_reactions 
ADD CONSTRAINT activity_reactions_target_type_check 
CHECK (target_type IN ('workout', 'achievement', 'pr', 'meal', 'activity_feed'));

-- Create meal_shares table
CREATE TABLE IF NOT EXISTS public.meal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_feed_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  food_entry_id UUID REFERENCES public.food_entries(id) ON DELETE CASCADE,
  alcohol_entry_id UUID REFERENCES public.alcohol_entries(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meal_shares_one_entry_check CHECK (
    (food_entry_id IS NOT NULL AND alcohol_entry_id IS NULL) OR
    (food_entry_id IS NULL AND alcohol_entry_id IS NOT NULL)
  )
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_meal_shares_user_id ON public.meal_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_shares_activity_id ON public.meal_shares(activity_feed_id);
CREATE INDEX IF NOT EXISTS idx_meal_shares_food_entry ON public.meal_shares(food_entry_id);
CREATE INDEX IF NOT EXISTS idx_meal_shares_alcohol_entry ON public.meal_shares(alcohol_entry_id);

-- Enable RLS
ALTER TABLE public.meal_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own meal shares" ON public.meal_shares;
DROP POLICY IF EXISTS "Users can delete their own meal shares" ON public.meal_shares;
DROP POLICY IF EXISTS "Users can view their own meal shares" ON public.meal_shares;
DROP POLICY IF EXISTS "Public meal shares are viewable by everyone" ON public.meal_shares;
DROP POLICY IF EXISTS "Followers can view meal shares with followers visibility" ON public.meal_shares;

-- RLS Policies for meal_shares
CREATE POLICY "Users can create their own meal shares"
  ON public.meal_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal shares"
  ON public.meal_shares
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own meal shares"
  ON public.meal_shares
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public meal shares are viewable by everyone"
  ON public.meal_shares
  FOR SELECT
  USING (
    is_public = true AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = meal_shares.user_id
      AND profiles.is_profile_public = true
    )
  );

CREATE POLICY "Followers can view meal shares with followers visibility"
  ON public.meal_shares
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = meal_shares.user_id
      AND (
        p.workout_visibility = 'public' OR
        (p.workout_visibility = 'followers' AND EXISTS (
          SELECT 1 FROM public.user_follows
          WHERE follower_id = auth.uid()
          AND following_id = meal_shares.user_id
          AND status = 'active'
        ))
      )
    )
  );