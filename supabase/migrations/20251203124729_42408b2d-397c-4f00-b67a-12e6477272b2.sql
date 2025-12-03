-- Retroactive XP calculation and award for existing users
-- Updates user_gamer_stats based on historical workout_logs, food_entries, water_intake

-- First, update the award_xp function with cyborg-themed ranks
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp_amount integer, p_source text DEFAULT 'action'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stats user_gamer_stats%ROWTYPE;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_new_prestige INTEGER;
  v_level_up BOOLEAN := false;
  v_prestige_up BOOLEAN := false;
  v_rank_title TEXT;
  v_rank_icon TEXT;
  v_xp_for_next INTEGER;
  v_coins_awarded INTEGER := 0;
BEGIN
  -- Get or create user stats
  SELECT * INTO v_stats FROM user_gamer_stats WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_gamer_stats (user_id) VALUES (p_user_id)
    RETURNING * INTO v_stats;
  END IF;
  
  -- Calculate new XP
  v_new_xp := v_stats.total_xp + p_xp_amount;
  v_new_level := v_stats.current_level;
  v_new_prestige := v_stats.prestige_level;
  
  -- Calculate XP requirements based on level ranges
  v_xp_for_next := CASE
    WHEN v_new_level <= 5 THEN 500
    WHEN v_new_level <= 10 THEN 750
    WHEN v_new_level <= 15 THEN 1000
    WHEN v_new_level <= 20 THEN 1250
    WHEN v_new_level <= 25 THEN 1500
    WHEN v_new_level <= 30 THEN 2000
    WHEN v_new_level <= 35 THEN 2500
    WHEN v_new_level <= 40 THEN 3000
    WHEN v_new_level <= 45 THEN 4000
    ELSE 5000
  END;
  
  -- Check for level up
  WHILE v_stats.current_level_xp + p_xp_amount >= v_xp_for_next AND v_new_level < 50 LOOP
    v_level_up := true;
    p_xp_amount := p_xp_amount - (v_xp_for_next - v_stats.current_level_xp);
    v_stats.current_level_xp := 0;
    v_new_level := v_new_level + 1;
    v_coins_awarded := v_coins_awarded + (v_new_level * 10);
    
    v_xp_for_next := CASE
      WHEN v_new_level <= 5 THEN 500
      WHEN v_new_level <= 10 THEN 750
      WHEN v_new_level <= 15 THEN 1000
      WHEN v_new_level <= 20 THEN 1250
      WHEN v_new_level <= 25 THEN 1500
      WHEN v_new_level <= 30 THEN 2000
      WHEN v_new_level <= 35 THEN 2500
      WHEN v_new_level <= 40 THEN 3000
      WHEN v_new_level <= 45 THEN 4000
      ELSE 5000
    END;
  END LOOP;
  
  -- Check for prestige
  IF v_new_level >= 50 AND v_stats.current_level_xp + p_xp_amount >= v_xp_for_next THEN
    v_prestige_up := true;
    v_new_prestige := v_new_prestige + 1;
    v_new_level := 1;
    v_stats.current_level_xp := 0;
    p_xp_amount := 0;
    v_coins_awarded := v_coins_awarded + 1000;
  END IF;
  
  -- Cyborg-themed rank titles and icons
  SELECT 
    CASE
      WHEN v_new_level <= 5 THEN 'Initiate'
      WHEN v_new_level <= 10 THEN 'Circuit'
      WHEN v_new_level <= 15 THEN 'Module'
      WHEN v_new_level <= 20 THEN 'Synth'
      WHEN v_new_level <= 25 THEN 'Mech'
      WHEN v_new_level <= 30 THEN 'Cyborg'
      WHEN v_new_level <= 35 THEN 'Android'
      WHEN v_new_level <= 40 THEN 'Titan'
      WHEN v_new_level <= 45 THEN 'Prime'
      ELSE 'Apex'
    END,
    CASE
      WHEN v_new_level <= 5 THEN '🔋'
      WHEN v_new_level <= 10 THEN '⚡'
      WHEN v_new_level <= 15 THEN '🔩'
      WHEN v_new_level <= 20 THEN '🦾'
      WHEN v_new_level <= 25 THEN '🤖'
      WHEN v_new_level <= 30 THEN '🔮'
      WHEN v_new_level <= 35 THEN '🧬'
      WHEN v_new_level <= 40 THEN '⚙️'
      WHEN v_new_level <= 45 THEN '💫'
      ELSE '🌟'
    END
  INTO v_rank_title, v_rank_icon;
  
  -- Update user stats
  UPDATE user_gamer_stats SET
    total_xp = v_new_xp,
    current_level = v_new_level,
    prestige_level = v_new_prestige,
    current_level_xp = v_stats.current_level_xp + p_xp_amount,
    xp_to_next_level = v_xp_for_next,
    rank_title = v_rank_title,
    rank_icon = v_rank_icon,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Award coins if level up
  IF v_coins_awarded > 0 THEN
    UPDATE profiles SET tap_coins = COALESCE(tap_coins, 0) + v_coins_awarded WHERE id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'xp_gained', p_xp_amount,
    'total_xp', v_new_xp,
    'current_level', v_new_level,
    'prestige_level', v_new_prestige,
    'rank_title', v_rank_title,
    'rank_icon', v_rank_icon,
    'level_up', v_level_up,
    'prestige_up', v_prestige_up,
    'coins_awarded', v_coins_awarded,
    'xp_to_next_level', v_xp_for_next,
    'current_level_xp', v_stats.current_level_xp + p_xp_amount
  );
END;
$function$;

-- Create function to calculate retroactive XP and level
CREATE OR REPLACE FUNCTION public.calculate_retroactive_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  workout_xp INTEGER;
  meal_xp INTEGER;
  water_xp INTEGER;
  total_xp INTEGER;
  calc_level INTEGER;
  calc_xp_in_level INTEGER;
  remaining_xp INTEGER;
  xp_needed INTEGER;
  rank_title TEXT;
  rank_icon TEXT;
  xp_to_next INTEGER;
BEGIN
  -- Loop through all users with profiles
  FOR user_record IN SELECT id FROM profiles
  LOOP
    -- Calculate XP from workouts (100 XP each)
    SELECT COALESCE(COUNT(*), 0) * 100 INTO workout_xp
    FROM workout_logs
    WHERE user_id = user_record.id AND completed_at IS NOT NULL;
    
    -- Calculate XP from meals (25 XP each)
    SELECT COALESCE(COUNT(*), 0) * 25 INTO meal_xp
    FROM food_entries
    WHERE user_id = user_record.id;
    
    -- Calculate XP from water entries (30 XP each)
    SELECT COALESCE(COUNT(*), 0) * 30 INTO water_xp
    FROM water_intake
    WHERE user_id = user_record.id;
    
    total_xp := workout_xp + meal_xp + water_xp;
    
    -- Skip if no XP earned
    IF total_xp = 0 THEN
      CONTINUE;
    END IF;
    
    -- Calculate level from total XP
    calc_level := 1;
    remaining_xp := total_xp;
    
    WHILE remaining_xp > 0 AND calc_level < 50 LOOP
      xp_needed := CASE
        WHEN calc_level <= 5 THEN 500
        WHEN calc_level <= 10 THEN 750
        WHEN calc_level <= 15 THEN 1000
        WHEN calc_level <= 20 THEN 1250
        WHEN calc_level <= 25 THEN 1500
        WHEN calc_level <= 30 THEN 2000
        WHEN calc_level <= 35 THEN 2500
        WHEN calc_level <= 40 THEN 3000
        WHEN calc_level <= 45 THEN 4000
        ELSE 5000
      END;
      
      IF remaining_xp >= xp_needed THEN
        remaining_xp := remaining_xp - xp_needed;
        calc_level := calc_level + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
    
    calc_xp_in_level := remaining_xp;
    
    -- Calculate XP to next level
    xp_to_next := CASE
      WHEN calc_level <= 5 THEN 500
      WHEN calc_level <= 10 THEN 750
      WHEN calc_level <= 15 THEN 1000
      WHEN calc_level <= 20 THEN 1250
      WHEN calc_level <= 25 THEN 1500
      WHEN calc_level <= 30 THEN 2000
      WHEN calc_level <= 35 THEN 2500
      WHEN calc_level <= 40 THEN 3000
      WHEN calc_level <= 45 THEN 4000
      ELSE 5000
    END;
    
    -- Determine cyborg rank
    rank_title := CASE
      WHEN calc_level <= 5 THEN 'Initiate'
      WHEN calc_level <= 10 THEN 'Circuit'
      WHEN calc_level <= 15 THEN 'Module'
      WHEN calc_level <= 20 THEN 'Synth'
      WHEN calc_level <= 25 THEN 'Mech'
      WHEN calc_level <= 30 THEN 'Cyborg'
      WHEN calc_level <= 35 THEN 'Android'
      WHEN calc_level <= 40 THEN 'Titan'
      WHEN calc_level <= 45 THEN 'Prime'
      ELSE 'Apex'
    END;
    
    rank_icon := CASE
      WHEN calc_level <= 5 THEN '🔋'
      WHEN calc_level <= 10 THEN '⚡'
      WHEN calc_level <= 15 THEN '🔩'
      WHEN calc_level <= 20 THEN '🦾'
      WHEN calc_level <= 25 THEN '🤖'
      WHEN calc_level <= 30 THEN '🔮'
      WHEN calc_level <= 35 THEN '🧬'
      WHEN calc_level <= 40 THEN '⚙️'
      WHEN calc_level <= 45 THEN '💫'
      ELSE '🌟'
    END;
    
    -- Upsert user_gamer_stats
    INSERT INTO user_gamer_stats (
      user_id, total_xp, current_level, current_level_xp, 
      xp_to_next_level, rank_title, rank_icon, prestige_level
    ) VALUES (
      user_record.id, total_xp, calc_level, calc_xp_in_level,
      xp_to_next, rank_title, rank_icon, 0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = EXCLUDED.total_xp,
      current_level = EXCLUDED.current_level,
      current_level_xp = EXCLUDED.current_level_xp,
      xp_to_next_level = EXCLUDED.xp_to_next_level,
      rank_title = EXCLUDED.rank_title,
      rank_icon = EXCLUDED.rank_icon,
      updated_at = now();
  END LOOP;
END;
$$;

-- Run the retroactive XP calculation
SELECT calculate_retroactive_xp();

-- Update achievement names to cyborg theme
UPDATE gamer_achievements SET 
  name = 'Coolant Systems Online',
  description = 'Reach your hydration goal 7 days in a row',
  badge_emoji = '💧'
WHERE trigger_type = 'hydration_streak' AND trigger_value = 7;

UPDATE gamer_achievements SET
  name = 'Core Processor Active',
  description = 'Complete your first workout',
  badge_emoji = '🔋'
WHERE trigger_type = 'workout_count' AND trigger_value = 1;

UPDATE gamer_achievements SET
  name = 'Systems Calibrated',
  description = 'Complete 10 workouts',
  badge_emoji = '⚡'
WHERE trigger_type = 'workout_count' AND trigger_value = 10;

UPDATE gamer_achievements SET
  name = 'Neural Network Expansion',
  description = 'Complete 50 workouts',
  badge_emoji = '🧠'
WHERE trigger_type = 'workout_count' AND trigger_value = 50;

UPDATE gamer_achievements SET
  name = 'Maximum Overdrive',
  description = 'Complete 100 workouts',
  badge_emoji = '🤖'
WHERE trigger_type = 'workout_count' AND trigger_value = 100;

UPDATE gamer_achievements SET
  name = 'Fuel Cells Optimized',
  description = 'Log 100 meals',
  badge_emoji = '🔋'
WHERE trigger_type = 'meal_count' AND trigger_value = 100;

UPDATE gamer_achievements SET
  name = 'Perpetual Motion',
  description = 'Maintain a 30-day workout streak',
  badge_emoji = '💫'
WHERE trigger_type = 'streak_days' AND trigger_value = 30;