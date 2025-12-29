-- Add escrow tracking columns to friend_challenges
ALTER TABLE public.friend_challenges
ADD COLUMN IF NOT EXISTS challenger_coins_escrowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS challenged_coins_escrowed BOOLEAN DEFAULT false;

-- Function to escrow coins when creating a challenge
CREATE OR REPLACE FUNCTION public.escrow_challenge_coins(
  _user_id UUID,
  _amount INTEGER,
  _challenge_id UUID,
  _is_challenger BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT tap_coins_balance INTO current_balance
  FROM profiles WHERE id = _user_id;
  
  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct coins and record transaction
  UPDATE profiles 
  SET tap_coins_balance = tap_coins_balance - _amount
  WHERE id = _user_id;
  
  INSERT INTO tap_coins_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, -_amount, 'challenge_escrow', 
    'Coins held for friend challenge wager', _challenge_id);
  
  -- Update escrow status on challenge
  IF _is_challenger THEN
    UPDATE friend_challenges SET challenger_coins_escrowed = true WHERE id = _challenge_id;
  ELSE
    UPDATE friend_challenges SET challenged_coins_escrowed = true WHERE id = _challenge_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to refund escrowed coins when challenge is declined
CREATE OR REPLACE FUNCTION public.refund_challenge_coins(
  _user_id UUID,
  _amount INTEGER,
  _challenge_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Refund coins
  UPDATE profiles 
  SET tap_coins_balance = tap_coins_balance + _amount
  WHERE id = _user_id;
  
  INSERT INTO tap_coins_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, _amount, 'challenge_refund', 
    'Coins refunded - challenge declined', _challenge_id);
  
  RETURN TRUE;
END;
$$;

-- Function to complete challenge and transfer coins to winner
CREATE OR REPLACE FUNCTION public.complete_friend_challenge(
  _challenge_id UUID,
  _winner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_record RECORD;
  total_pot INTEGER;
  loser_id UUID;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record
  FROM friend_challenges
  WHERE id = _challenge_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verify both parties escrowed coins
  IF NOT (challenge_record.challenger_coins_escrowed AND challenge_record.challenged_coins_escrowed) THEN
    -- If escrow wasn't complete, just mark as completed without coin transfer
    UPDATE friend_challenges 
    SET status = 'completed', winner_id = _winner_id, completed_at = now()
    WHERE id = _challenge_id;
    RETURN TRUE;
  END IF;
  
  -- Calculate total pot (2x the coin reward)
  total_pot := challenge_record.coin_reward * 2;
  
  -- Determine loser
  IF _winner_id = challenge_record.challenger_id THEN
    loser_id := challenge_record.challenged_id;
  ELSE
    loser_id := challenge_record.challenger_id;
  END IF;
  
  -- Award total pot to winner
  UPDATE profiles 
  SET tap_coins_balance = tap_coins_balance + total_pot
  WHERE id = _winner_id;
  
  INSERT INTO tap_coins_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_winner_id, total_pot, 'challenge_won', 
    'Won friend challenge wager!', _challenge_id);
  
  -- Update challenge status
  UPDATE friend_challenges 
  SET status = 'completed', winner_id = _winner_id, completed_at = now()
  WHERE id = _challenge_id;
  
  -- Create notifications for both users
  INSERT INTO notifications (user_id, actor_id, notification_type, notification_data, reference_id)
  VALUES 
    (_winner_id, loser_id, 'challenge_won', 
      jsonb_build_object('coins_won', total_pot, 'challenge_id', _challenge_id), _challenge_id),
    (loser_id, _winner_id, 'challenge_lost', 
      jsonb_build_object('coins_lost', challenge_record.coin_reward, 'challenge_id', _challenge_id), _challenge_id);
  
  RETURN TRUE;
END;
$$;

-- Trigger function to auto-complete challenges when target is reached
CREATE OR REPLACE FUNCTION public.check_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  winner UUID;
BEGIN
  -- Only check active challenges
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;
  
  -- Check if challenger reached target first
  IF NEW.challenger_progress >= NEW.target_value THEN
    winner := NEW.challenger_id;
  -- Check if challenged reached target
  ELSIF NEW.challenged_progress >= NEW.target_value THEN
    winner := NEW.challenged_id;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Complete the challenge
  PERFORM complete_friend_challenge(NEW.id, winner);
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-completion
DROP TRIGGER IF EXISTS trigger_check_challenge_completion ON friend_challenges;
CREATE TRIGGER trigger_check_challenge_completion
  AFTER UPDATE OF challenger_progress, challenged_progress ON friend_challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_challenge_completion();