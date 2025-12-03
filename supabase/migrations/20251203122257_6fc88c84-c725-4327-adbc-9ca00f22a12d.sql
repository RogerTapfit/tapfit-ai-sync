-- Create user_gamer_stats table for tracking XP and levels
CREATE TABLE public.user_gamer_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  prestige_level INTEGER NOT NULL DEFAULT 0,
  current_level_xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 500,
  rank_title TEXT NOT NULL DEFAULT 'Recruit',
  rank_icon TEXT NOT NULL DEFAULT '🪖',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create gamer_achievements table for achievement definitions
CREATE TABLE public.gamer_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hydration', 'nutrition', 'workout', 'streak', 'special')),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 10,
  badge_emoji TEXT NOT NULL DEFAULT '🏆',
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  trigger_type TEXT NOT NULL,
  trigger_value INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_gamer_achievements table for tracking unlocked achievements
CREATE TABLE public.user_gamer_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.gamer_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_gamer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamer_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_gamer_stats
CREATE POLICY "Users can view their own gamer stats"
  ON public.user_gamer_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamer stats"
  ON public.user_gamer_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamer stats"
  ON public.user_gamer_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow viewing other users' gamer stats for social features
CREATE POLICY "Users can view public gamer stats"
  ON public.user_gamer_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_gamer_stats.user_id 
    AND p.is_profile_public = true
  ));

-- RLS policies for gamer_achievements
CREATE POLICY "Everyone can view active achievements"
  ON public.gamer_achievements FOR SELECT
  USING (is_active = true);

-- RLS policies for user_gamer_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_gamer_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_gamer_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow viewing other users' achievements for social features
CREATE POLICY "Users can view public user achievements"
  ON public.user_gamer_achievements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_gamer_achievements.user_id 
    AND p.is_profile_public = true
  ));

-- Seed initial achievements
INSERT INTO public.gamer_achievements (name, description, category, xp_reward, coin_reward, badge_emoji, rarity, trigger_type, trigger_value) VALUES
-- Hydration Achievements
('First Sip', 'Log your first water entry', 'hydration', 25, 5, '💧', 'common', 'water_entries', 1),
('Hydration Habit', 'Hit water goal 3 days in a row', 'hydration', 100, 20, '💧', 'common', 'water_streak', 3),
('Water Warrior', 'Hit water goal 7 days in a row', 'hydration', 250, 50, '🌊', 'rare', 'water_streak', 7),
('Hydration Hero', 'Hit water goal 14 days in a row', 'hydration', 500, 100, '🏊', 'epic', 'water_streak', 14),
('Ocean Master', 'Hit water goal 30 days in a row', 'hydration', 1000, 250, '🔱', 'legendary', 'water_streak', 30),
('Gallon Gang', 'Drink 1 gallon in a single day', 'hydration', 150, 30, '🪣', 'rare', 'daily_water_ml', 3785),

-- Nutrition Achievements
('Food Logger', 'Log 10 meals', 'nutrition', 50, 10, '🍎', 'common', 'meals_logged', 10),
('Photo Pro', 'Log 25 meals with photos', 'nutrition', 200, 40, '📸', 'rare', 'meals_with_photos', 25),
('Clean Eater', 'Get 5 A-grade meals in a row', 'nutrition', 300, 75, '🥗', 'epic', 'a_grade_streak', 5),
('Macro Master', 'Hit all macros for 7 days', 'nutrition', 500, 100, '📊', 'epic', 'macro_streak', 7),
('Nutrition Ninja', 'Log food for 30 days straight', 'nutrition', 1000, 200, '🥷', 'legendary', 'food_log_streak', 30),
('Protein King', 'Hit protein goal 10 days', 'nutrition', 200, 40, '💪', 'rare', 'protein_goal_days', 10),

-- Workout Achievements
('First Rep', 'Complete your first workout', 'workout', 50, 10, '🏋️', 'common', 'workouts_completed', 1),
('Getting Serious', 'Complete 10 workouts', 'workout', 200, 50, '💪', 'common', 'workouts_completed', 10),
('Gym Rat', 'Complete 50 workouts', 'workout', 500, 100, '🐀', 'rare', 'workouts_completed', 50),
('Iron Will', 'Complete 100 workouts', 'workout', 1000, 250, '🦾', 'epic', 'workouts_completed', 100),
('Beast Mode', 'Complete 500 workouts', 'workout', 5000, 1000, '🦁', 'legendary', 'workouts_completed', 500),
('Legend', 'Complete 1000 workouts', 'workout', 10000, 2500, '👑', 'mythic', 'workouts_completed', 1000),
('Early Bird', 'Complete 10 workouts before 7 AM', 'workout', 300, 60, '🌅', 'rare', 'morning_workouts', 10),
('Night Owl', 'Complete 10 workouts after 9 PM', 'workout', 300, 60, '🦉', 'rare', 'evening_workouts', 10),
('Weekend Warrior', 'Complete 20 weekend workouts', 'workout', 400, 80, '🗓️', 'rare', 'weekend_workouts', 20),
('PR Machine', 'Set 10 personal records', 'workout', 500, 100, '🏆', 'epic', 'personal_records', 10),

-- Streak Achievements
('On Fire', '3-day workout streak', 'streak', 75, 15, '🔥', 'common', 'workout_streak', 3),
('Week Warrior', '7-day workout streak', 'streak', 200, 50, '⚡', 'rare', 'workout_streak', 7),
('Fortnight Fighter', '14-day workout streak', 'streak', 500, 100, '💥', 'epic', 'workout_streak', 14),
('Monthly Master', '30-day workout streak', 'streak', 1000, 250, '🌟', 'legendary', 'workout_streak', 30),
('Unstoppable', '100-day workout streak', 'streak', 5000, 1000, '⭐', 'mythic', 'workout_streak', 100),
('Consistency King', '60-day workout streak', 'streak', 2500, 500, '🎯', 'legendary', 'workout_streak', 60),

-- Special Achievements
('Social Butterfly', 'Follow 10 users', 'special', 100, 25, '🦋', 'common', 'users_followed', 10),
('Trendsetter', 'Get 50 reactions on activities', 'special', 300, 75, '✨', 'rare', 'reactions_received', 50),
('First Prestige', 'Reach prestige level 1', 'special', 1000, 500, '⭐', 'legendary', 'prestige_level', 1),
('Body Scanner', 'Complete 5 body scans', 'special', 250, 50, '📱', 'rare', 'body_scans', 5),
('Challenge Champion', 'Complete 10 challenges', 'special', 750, 150, '🏅', 'epic', 'challenges_completed', 10),
('Sleep Champion', 'Log sleep for 7 days straight', 'special', 200, 40, '😴', 'rare', 'sleep_streak', 7),
('Step Master', 'Log 10,000+ steps in a day', 'special', 150, 30, '👟', 'rare', 'daily_steps', 10000),
('Cardio King', 'Complete 20 cardio sessions', 'special', 400, 80, '🏃', 'rare', 'cardio_sessions', 20);

-- Create function to award XP and handle level ups
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT DEFAULT 'action'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Levels 1-5: 500 XP, 6-10: 750 XP, 11-15: 1000 XP, etc.
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
    v_coins_awarded := v_coins_awarded + (v_new_level * 10); -- Bonus coins per level
    
    -- Recalculate XP for next level
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
  
  -- Check for prestige (level 50 max)
  IF v_new_level >= 50 AND v_stats.current_level_xp + p_xp_amount >= v_xp_for_next THEN
    v_prestige_up := true;
    v_new_prestige := v_new_prestige + 1;
    v_new_level := 1;
    v_stats.current_level_xp := 0;
    p_xp_amount := 0;
    v_coins_awarded := v_coins_awarded + 1000; -- Prestige bonus
  END IF;
  
  -- Determine rank title and icon based on level
  SELECT 
    CASE
      WHEN v_new_level <= 5 THEN 'Recruit'
      WHEN v_new_level <= 10 THEN 'Private'
      WHEN v_new_level <= 15 THEN 'Corporal'
      WHEN v_new_level <= 20 THEN 'Sergeant'
      WHEN v_new_level <= 25 THEN 'Lieutenant'
      WHEN v_new_level <= 30 THEN 'Captain'
      WHEN v_new_level <= 35 THEN 'Major'
      WHEN v_new_level <= 40 THEN 'Colonel'
      WHEN v_new_level <= 45 THEN 'General'
      ELSE 'Commander'
    END,
    CASE
      WHEN v_new_level <= 5 THEN '🪖'
      WHEN v_new_level <= 10 THEN '⭐'
      WHEN v_new_level <= 15 THEN '⭐⭐'
      WHEN v_new_level <= 20 THEN '🎖️'
      WHEN v_new_level <= 25 THEN '🎖️⭐'
      WHEN v_new_level <= 30 THEN '🏅'
      WHEN v_new_level <= 35 THEN '🏅⭐'
      WHEN v_new_level <= 40 THEN '🎯'
      WHEN v_new_level <= 45 THEN '👑'
      ELSE '💎'
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
$$;