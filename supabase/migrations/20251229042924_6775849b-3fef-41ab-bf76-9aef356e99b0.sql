-- Create function to notify followers when a user completes a cardio activity
CREATE OR REPLACE FUNCTION public.notify_followers_on_cardio_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_record RECORD;
  activity_name TEXT;
  notification_data JSONB;
  user_profile RECORD;
BEGIN
  -- Only proceed when activity is completed
  IF NEW.status != 'completed' OR (OLD IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Get the user's profile to check share_workout_stats
  SELECT id, username, full_name, avatar_url, share_workout_stats
  INTO user_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Only notify if user has sharing enabled
  IF NOT COALESCE(user_profile.share_workout_stats, true) THEN
    RETURN NEW;
  END IF;

  -- Determine activity type based on table name
  activity_name := TG_ARGV[0];

  -- Build notification data based on activity type
  IF activity_name = 'run' OR activity_name = 'walk' THEN
    notification_data := jsonb_build_object(
      'activity_type', COALESCE(NEW.activity_type, activity_name),
      'distance_km', ROUND((NEW.total_distance_m / 1000.0)::numeric, 2),
      'duration_min', ROUND((NEW.moving_time_s / 60.0)::numeric, 1),
      'pace_min_per_km', CASE WHEN NEW.total_distance_m > 0 THEN ROUND(((NEW.moving_time_s / 60.0) / (NEW.total_distance_m / 1000.0))::numeric, 2) ELSE NULL END,
      'calories', NEW.calories_burned
    );
  ELSIF activity_name = 'swim' THEN
    notification_data := jsonb_build_object(
      'activity_type', 'swim',
      'distance_m', NEW.total_distance_m,
      'laps', NEW.total_laps,
      'duration_min', ROUND((NEW.moving_time_s / 60.0)::numeric, 1),
      'calories', NEW.calories_burned
    );
  ELSIF activity_name = 'ride' THEN
    notification_data := jsonb_build_object(
      'activity_type', 'ride',
      'distance_km', ROUND((NEW.total_distance_m / 1000.0)::numeric, 2),
      'duration_min', ROUND((NEW.moving_time_s / 60.0)::numeric, 1),
      'avg_speed_kmh', NEW.avg_speed_kmh,
      'calories', NEW.calories
    );
  END IF;

  -- Insert notifications for all active followers
  FOR follower_record IN
    SELECT uf.follower_id
    FROM public.user_follows uf
    WHERE uf.following_id = NEW.user_id
      AND uf.status = 'active'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      actor_id,
      notification_type,
      notification_data,
      reference_id,
      read
    ) VALUES (
      follower_record.follower_id,
      NEW.user_id,
      'cardio_completed',
      notification_data,
      NEW.id,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create triggers for each cardio session type
DROP TRIGGER IF EXISTS notify_followers_run_trigger ON public.run_sessions;
CREATE TRIGGER notify_followers_run_trigger
AFTER INSERT OR UPDATE ON public.run_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_cardio_completion('run');

DROP TRIGGER IF EXISTS notify_followers_swim_trigger ON public.swim_sessions;
CREATE TRIGGER notify_followers_swim_trigger
AFTER INSERT OR UPDATE ON public.swim_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_cardio_completion('swim');

DROP TRIGGER IF EXISTS notify_followers_ride_trigger ON public.ride_sessions;
CREATE TRIGGER notify_followers_ride_trigger
AFTER INSERT OR UPDATE ON public.ride_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_cardio_completion('ride');