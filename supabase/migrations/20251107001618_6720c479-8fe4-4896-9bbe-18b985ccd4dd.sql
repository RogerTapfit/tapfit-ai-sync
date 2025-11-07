-- Fix search_path security warnings for trigger functions

-- Update create_pr_activity function with search_path
CREATE OR REPLACE FUNCTION public.create_pr_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update create_achievement_activity function with search_path
CREATE OR REPLACE FUNCTION public.create_achievement_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update create_workout_milestone_activity function with search_path
CREATE OR REPLACE FUNCTION public.create_workout_milestone_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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