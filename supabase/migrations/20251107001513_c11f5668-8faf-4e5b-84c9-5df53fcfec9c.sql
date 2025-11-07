-- Create activity_feed table to track user activities
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('pr', 'achievement', 'workout_milestone', 'streak_milestone')),
  activity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_type ON public.activity_feed(activity_type);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can view activities from people they follow
CREATE POLICY "Users can view activities from followed users"
ON public.activity_feed
FOR SELECT
USING (
  user_id IN (
    SELECT following_id 
    FROM user_follows 
    WHERE follower_id = auth.uid() 
    AND status = 'active'
  )
  OR user_id = auth.uid()
);

-- System can insert activities
CREATE POLICY "System can insert activities"
ON public.activity_feed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to create activity for new PR
CREATE OR REPLACE FUNCTION public.create_pr_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, activity_data, reference_id)
  VALUES (
    NEW.user_id,
    'pr',
    jsonb_build_object(
      'machine_name', NEW.machine_name,
      'exercise_name', NEW.exercise_name,
      'weight_lbs', NEW.weight_lbs,
      'reps', NEW.reps,
      'improvement_percentage', NEW.improvement_percentage
    ),
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Trigger for new PRs
CREATE TRIGGER on_personal_record_created
  AFTER INSERT ON public.personal_records
  FOR EACH ROW
  EXECUTE FUNCTION public.create_pr_activity();

-- Function to create activity for new achievement
CREATE OR REPLACE FUNCTION public.create_achievement_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  achievement_info RECORD;
BEGIN
  SELECT name, description, badge_icon, badge_color
  INTO achievement_info
  FROM achievements
  WHERE id = NEW.achievement_id;

  INSERT INTO public.activity_feed (user_id, activity_type, activity_data, reference_id)
  VALUES (
    NEW.user_id,
    'achievement',
    jsonb_build_object(
      'achievement_name', achievement_info.name,
      'description', achievement_info.description,
      'badge_icon', achievement_info.badge_icon,
      'badge_color', achievement_info.badge_color,
      'coins_earned', NEW.coins_earned
    ),
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Trigger for new achievements
CREATE TRIGGER on_achievement_unlocked
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.create_achievement_activity();

-- Function to create activity for workout milestones
CREATE OR REPLACE FUNCTION public.create_workout_milestone_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_workouts INTEGER;
  milestone_reached INTEGER;
BEGIN
  -- Only trigger on completed workouts
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD IS NULL) THEN
    -- Count total completed workouts
    SELECT COUNT(*)
    INTO total_workouts
    FROM workout_logs
    WHERE user_id = NEW.user_id
    AND completed_at IS NOT NULL;

    -- Check if milestone reached (10, 25, 50, 100, 250, 500)
    milestone_reached := CASE
      WHEN total_workouts = 10 THEN 10
      WHEN total_workouts = 25 THEN 25
      WHEN total_workouts = 50 THEN 50
      WHEN total_workouts = 100 THEN 100
      WHEN total_workouts = 250 THEN 250
      WHEN total_workouts = 500 THEN 500
      ELSE 0
    END;

    IF milestone_reached > 0 THEN
      INSERT INTO public.activity_feed (user_id, activity_type, activity_data, reference_id)
      VALUES (
        NEW.user_id,
        'workout_milestone',
        jsonb_build_object(
          'milestone', milestone_reached,
          'total_workouts', total_workouts
        ),
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for workout milestones
CREATE TRIGGER on_workout_completed_milestone
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_workout_milestone_activity();