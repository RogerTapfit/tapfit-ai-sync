-- Add share_sobriety_journey column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS share_sobriety_journey BOOLEAN DEFAULT false;

-- Create RLS policy to allow reading other users' sobriety journeys when sharing is enabled
CREATE POLICY "Users can view shared sobriety journeys"
ON public.sobriety_tracking
FOR SELECT
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = sobriety_tracking.user_id 
    AND profiles.share_sobriety_journey = true
  )
);

-- Create function to update friend challenge progress from sobriety check-ins
CREATE OR REPLACE FUNCTION public.update_sobriety_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  consecutive_days INTEGER;
  user_journey RECORD;
BEGIN
  -- Get the user's active sobriety journey
  SELECT * INTO user_journey
  FROM public.sobriety_tracking
  WHERE user_id = NEW.user_id
    AND is_active = true
  LIMIT 1;

  IF user_journey IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate consecutive sober days from journey start
  SELECT COUNT(*)::INTEGER INTO consecutive_days
  FROM public.sobriety_daily_checkins
  WHERE journey_id = user_journey.id;

  -- Update any active sobriety challenges where this user is a participant
  FOR challenge_record IN
    SELECT * FROM public.friend_challenges
    WHERE status = 'active'
      AND challenge_type LIKE 'sober_%'
      AND (challenger_id = NEW.user_id OR challenged_id = NEW.user_id)
  LOOP
    -- Update progress for the appropriate participant
    IF challenge_record.challenger_id = NEW.user_id THEN
      UPDATE public.friend_challenges
      SET challenger_progress = consecutive_days
      WHERE id = challenge_record.id;
    ELSE
      UPDATE public.friend_challenges
      SET challenged_progress = consecutive_days
      WHERE id = challenge_record.id;
    END IF;

    -- Check if either participant has reached the target
    IF consecutive_days >= challenge_record.target_value THEN
      UPDATE public.friend_challenges
      SET 
        status = 'completed',
        completed_at = NOW(),
        winner_id = NEW.user_id
      WHERE id = challenge_record.id
        AND status = 'active';

      -- Award coins to winner (2x the wager)
      IF challenge_record.coin_reward IS NOT NULL AND challenge_record.coin_reward > 0 THEN
        UPDATE public.profiles
        SET coins = coins + (challenge_record.coin_reward * 2)
        WHERE id = NEW.user_id;

        -- Log the coin transaction
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
        VALUES (NEW.user_id, challenge_record.coin_reward * 2, 'challenge_won', 
                'Won sobriety challenge: ' || challenge_record.challenge_type);

        -- Create notification for winner
        INSERT INTO public.notifications (user_id, actor_id, notification_type, notification_data, reference_id)
        VALUES (
          NEW.user_id,
          CASE WHEN challenge_record.challenger_id = NEW.user_id 
               THEN challenge_record.challenged_id 
               ELSE challenge_record.challenger_id END,
          'challenge_won',
          jsonb_build_object(
            'challenge_type', challenge_record.challenge_type,
            'coins_won', challenge_record.coin_reward * 2,
            'target_days', challenge_record.target_value
          ),
          challenge_record.id
        );

        -- Create notification for loser
        INSERT INTO public.notifications (user_id, actor_id, notification_type, notification_data, reference_id)
        VALUES (
          CASE WHEN challenge_record.challenger_id = NEW.user_id 
               THEN challenge_record.challenged_id 
               ELSE challenge_record.challenger_id END,
          NEW.user_id,
          'challenge_lost',
          jsonb_build_object(
            'challenge_type', challenge_record.challenge_type,
            'coins_lost', challenge_record.coin_reward,
            'target_days', challenge_record.target_value
          ),
          challenge_record.id
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to fire on new sobriety check-ins
DROP TRIGGER IF EXISTS on_sobriety_checkin_update_challenge ON public.sobriety_daily_checkins;
CREATE TRIGGER on_sobriety_checkin_update_challenge
AFTER INSERT ON public.sobriety_daily_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_sobriety_challenge_progress();