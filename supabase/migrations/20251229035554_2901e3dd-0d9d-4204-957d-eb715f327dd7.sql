-- Add new activity types for cardio activities
ALTER TABLE public.activity_feed 
DROP CONSTRAINT IF EXISTS activity_feed_activity_type_check;

ALTER TABLE public.activity_feed 
ADD CONSTRAINT activity_feed_activity_type_check 
CHECK (activity_type IN (
  'pr', 'achievement', 'workout_milestone', 'streak_milestone', 
  'meal_logged', 'restaurant_meal', 'alcohol_logged',
  'run_completed', 'walk_completed', 'swim_completed'
));

-- Create friend_challenges table
CREATE TABLE IF NOT EXISTS public.friend_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('run_distance', 'walk_distance', 'swim_distance', 'run_time', 'walk_time', 'swim_time', 'total_workouts')),
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL DEFAULT 'km',
  time_limit_days INTEGER NOT NULL DEFAULT 7,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'completed', 'expired')),
  challenger_progress NUMERIC DEFAULT 0,
  challenged_progress NUMERIC DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id),
  coin_reward INTEGER DEFAULT 50,
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (challenger_id != challenged_id)
);

-- Enable RLS on friend_challenges
ALTER TABLE public.friend_challenges ENABLE ROW LEVEL SECURITY;

-- Users can see challenges they are part of
CREATE POLICY "Users can view own challenges"
ON public.friend_challenges FOR SELECT
TO authenticated
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Users can create challenges
CREATE POLICY "Users can create challenges"
ON public.friend_challenges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = challenger_id);

-- Users can update challenges they are part of
CREATE POLICY "Users can update own challenges"
ON public.friend_challenges FOR UPDATE
TO authenticated
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Add RLS policies for run_sessions to allow followers to view
CREATE POLICY "Followers can view run sessions"
ON public.run_sessions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_follows uf
    JOIN public.profiles p ON p.id = run_sessions.user_id
    WHERE uf.follower_id = auth.uid()
      AND uf.following_id = run_sessions.user_id
      AND uf.status = 'active'
      AND p.share_workout_stats = true
  )
);

-- Add RLS policies for swim_sessions to allow followers to view
CREATE POLICY "Followers can view swim sessions"
ON public.swim_sessions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_follows uf
    JOIN public.profiles p ON p.id = swim_sessions.user_id
    WHERE uf.follower_id = auth.uid()
      AND uf.following_id = swim_sessions.user_id
      AND uf.status = 'active'
      AND p.share_workout_stats = true
  )
);

-- Create function to auto-post run/walk sessions to activity feed
CREATE OR REPLACE FUNCTION public.create_run_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create activity when session is completed
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.activity_feed (user_id, activity_type, activity_data, reference_id)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.activity_type = 'walk' THEN 'walk_completed' ELSE 'run_completed' END,
      jsonb_build_object(
        'distance_km', ROUND((NEW.total_distance_m / 1000.0)::numeric, 2),
        'duration_min', ROUND((NEW.moving_time_s / 60.0)::numeric, 1),
        'pace_min_per_km', CASE WHEN NEW.total_distance_m > 0 THEN ROUND(((NEW.moving_time_s / 60.0) / (NEW.total_distance_m / 1000.0))::numeric, 2) ELSE NULL END,
        'calories', NEW.calories_burned,
        'started_at', NEW.started_at,
        'activity_type', COALESCE(NEW.activity_type, 'run')
      ),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for run sessions
DROP TRIGGER IF EXISTS run_session_activity_trigger ON public.run_sessions;
CREATE TRIGGER run_session_activity_trigger
AFTER INSERT OR UPDATE ON public.run_sessions
FOR EACH ROW
EXECUTE FUNCTION public.create_run_activity();

-- Create function to auto-post swim sessions to activity feed
CREATE OR REPLACE FUNCTION public.create_swim_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create activity when session is completed
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.activity_feed (user_id, activity_type, activity_data, reference_id)
    VALUES (
      NEW.user_id,
      'swim_completed',
      jsonb_build_object(
        'distance_m', NEW.total_distance_m,
        'laps', NEW.total_laps,
        'duration_min', ROUND((NEW.moving_time_s / 60.0)::numeric, 1),
        'calories', NEW.calories_burned,
        'pool_length_m', NEW.pool_length_m,
        'started_at', NEW.started_at
      ),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for swim sessions
DROP TRIGGER IF EXISTS swim_session_activity_trigger ON public.swim_sessions;
CREATE TRIGGER swim_session_activity_trigger
AFTER INSERT OR UPDATE ON public.swim_sessions
FOR EACH ROW
EXECUTE FUNCTION public.create_swim_activity();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenger ON public.friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenged ON public.friend_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_status ON public.friend_challenges(status);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON public.activity_feed(activity_type);