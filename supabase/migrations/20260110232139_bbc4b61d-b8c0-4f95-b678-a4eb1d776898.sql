-- Fix the trigger function to use correct column name (sobriety_id instead of journey_id)
CREATE OR REPLACE FUNCTION public.update_sobriety_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  user_journey RECORD;
  consecutive_days INTEGER;
  challenge_record RECORD;
BEGIN
  -- Get the user's active sobriety journey
  SELECT * INTO user_journey
  FROM public.sobriety_tracking
  WHERE user_id = NEW.user_id
    AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate consecutive sober days from journey start
  SELECT COUNT(*)::INTEGER INTO consecutive_days
  FROM public.sobriety_daily_checkins
  WHERE sobriety_id = user_journey.id;

  -- Update any active sobriety challenges where this user is a participant
  FOR challenge_record IN
    SELECT * FROM public.friend_challenges
    WHERE status = 'active'
      AND challenge_type IN ('sobriety_alcohol', 'sobriety_sugar', 'sobriety_caffeine', 'sobriety_smoking', 'sobriety_general')
      AND (challenger_id = NEW.user_id OR challenged_id = NEW.user_id)
  LOOP
    IF challenge_record.challenger_id = NEW.user_id THEN
      UPDATE public.friend_challenges
      SET challenger_progress = consecutive_days
      WHERE id = challenge_record.id;
    ELSE
      UPDATE public.friend_challenges
      SET challenged_progress = consecutive_days
      WHERE id = challenge_record.id;
    END IF;

    -- Check if challenge is won
    IF consecutive_days >= challenge_record.target_value THEN
      UPDATE public.friend_challenges
      SET status = 'completed',
          completed_at = NOW(),
          winner_id = NEW.user_id
      WHERE id = challenge_record.id
        AND status = 'active';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;