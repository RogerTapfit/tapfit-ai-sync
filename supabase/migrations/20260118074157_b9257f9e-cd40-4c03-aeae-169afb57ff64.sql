-- Drop and recreate award_xp function with correct column name
DROP FUNCTION IF EXISTS public.award_xp(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT DEFAULT 'activity'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stats RECORD;
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
  v_xp_for_next_level INTEGER;
  v_level_up BOOLEAN := FALSE;
  v_old_level INTEGER;
  v_coins_awarded INTEGER := 0;
  v_rank_info JSON;
  remaining_xp INTEGER;
  level_xp INTEGER;
BEGIN
  -- Get current stats
  SELECT * INTO v_current_stats FROM user_gamer_stats WHERE user_id = p_user_id;
  
  -- Create stats if they don't exist
  IF v_current_stats IS NULL THEN
    INSERT INTO user_gamer_stats (user_id, total_xp, current_level, prestige_level)
    VALUES (p_user_id, 0, 1, 0)
    RETURNING * INTO v_current_stats;
  END IF;
  
  v_old_level := v_current_stats.current_level;
  v_new_total_xp := v_current_stats.total_xp + p_xp_amount;
  
  -- Calculate new level based on XP thresholds
  v_new_level := 1;
  v_xp_for_next_level := 500;
  remaining_xp := v_new_total_xp;
  
  WHILE remaining_xp >= 0 AND v_new_level <= 50 LOOP
    -- Determine XP needed for current level
    CASE
      WHEN v_new_level <= 5 THEN level_xp := 500;
      WHEN v_new_level <= 10 THEN level_xp := 750;
      WHEN v_new_level <= 15 THEN level_xp := 1000;
      WHEN v_new_level <= 20 THEN level_xp := 1250;
      WHEN v_new_level <= 25 THEN level_xp := 1500;
      WHEN v_new_level <= 30 THEN level_xp := 2000;
      WHEN v_new_level <= 35 THEN level_xp := 2500;
      WHEN v_new_level <= 40 THEN level_xp := 3000;
      WHEN v_new_level <= 45 THEN level_xp := 4000;
      ELSE level_xp := 5000;
    END CASE;
    
    IF remaining_xp >= level_xp THEN
      remaining_xp := remaining_xp - level_xp;
      v_new_level := v_new_level + 1;
    ELSE
      v_xp_for_next_level := level_xp;
      EXIT;
    END IF;
  END LOOP;
  
  -- Cap at level 50
  IF v_new_level > 50 THEN
    v_new_level := 50;
  END IF;
  
  -- Check for level up
  IF v_new_level > v_old_level THEN
    v_level_up := TRUE;
    v_coins_awarded := (v_new_level - v_old_level) * 10;
  END IF;
  
  -- Update stats
  UPDATE user_gamer_stats
  SET 
    total_xp = v_new_total_xp,
    current_level = v_new_level,
    xp_to_next_level = v_xp_for_next_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Award coins if leveled up - FIXED: use tap_coins_balance
  IF v_coins_awarded > 0 THEN
    UPDATE profiles 
    SET tap_coins_balance = COALESCE(tap_coins_balance, 0) + v_coins_awarded
    WHERE id = p_user_id;
  END IF;
  
  -- Build rank info
  v_rank_info := json_build_object(
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'old_level', v_old_level,
    'level_up', v_level_up,
    'coins_awarded', v_coins_awarded,
    'xp_to_next_level', v_xp_for_next_level,
    'xp_awarded', p_xp_amount,
    'source', p_source
  );
  
  RETURN v_rank_info;
END;
$$;