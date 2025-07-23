-- Create challenges table for preset and AI-generated challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('workout_count', 'streak', 'muscle_group', 'calories', 'steps', 'custom')),
  target_value INTEGER NOT NULL,
  time_limit_days INTEGER, -- NULL for no time limit
  coin_reward INTEGER NOT NULL DEFAULT 0,
  bonus_coin_reward INTEGER DEFAULT 0, -- Extra coins for early completion
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT false, -- Weekly recurring challenges
  difficulty_level TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'extreme')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_challenges table to track user progress
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL, -- Copy from challenge at time of start
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Based on time_limit_days
  coins_earned INTEGER DEFAULT 0,
  early_completion_bonus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, started_at) -- Prevent duplicate active challenges
);

-- Create achievements table for milestone definitions
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('workout_milestone', 'streak_milestone', 'stats_milestone', 'special')),
  trigger_condition JSONB NOT NULL, -- Flexible condition storage
  coin_reward INTEGER NOT NULL DEFAULT 0,
  badge_icon TEXT, -- Icon name/emoji for badge
  badge_color TEXT NOT NULL DEFAULT 'bronze' CHECK (badge_color IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  rarity_level TEXT NOT NULL DEFAULT 'common' CHECK (rarity_level IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table for unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id) -- Prevent duplicate achievements
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read, admin manage)
CREATE POLICY "Everyone can view active challenges" ON public.challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges" ON public.user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" ON public.user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for achievements (public read, admin manage)
CREATE POLICY "Everyone can view active achievements" ON public.achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default challenges
INSERT INTO public.challenges (name, description, challenge_type, target_value, time_limit_days, coin_reward, bonus_coin_reward, is_recurring, difficulty_level) VALUES
('5 Workouts This Week', 'Complete 5 workout sessions within 7 days', 'workout_count', 5, 7, 50, 10, true, 'medium'),
('Leg Day 3x in 7 Days', 'Focus on leg workouts 3 times this week', 'muscle_group', 3, 7, 40, 8, true, 'medium'),
('Burn 3,000 Calories This Week', 'Burn a total of 3,000 calories through workouts', 'calories', 3000, 7, 75, 15, true, 'hard'),
('Train 10 Days in a Row', 'Maintain a 10-day workout streak', 'streak', 10, NULL, 100, 25, false, 'hard'),
('Weekend Warrior', 'Complete workouts on both Saturday and Sunday', 'custom', 2, 2, 30, 5, true, 'easy'),
('Early Bird Special', 'Complete 3 morning workouts (before 9 AM)', 'custom', 3, 7, 35, 10, true, 'medium'),
('Push Day Master', 'Complete 4 chest/shoulder/tricep focused workouts', 'muscle_group', 4, 14, 60, 12, false, 'medium'),
('Cardio King', 'Complete 5 cardio sessions this week', 'custom', 5, 7, 45, 8, true, 'medium');

-- Insert some default achievements
INSERT INTO public.achievements (name, description, achievement_type, trigger_condition, coin_reward, badge_icon, badge_color, rarity_level) VALUES
('First Steps', 'Complete your first workout', 'workout_milestone', '{"workout_count": 1}', 10, '🎯', 'bronze', 'common'),
('Getting Started', 'Complete 10 workouts', 'workout_milestone', '{"workout_count": 10}', 50, '💪', 'bronze', 'common'),
('Fitness Enthusiast', 'Complete 50 workouts', 'workout_milestone', '{"workout_count": 50}', 150, '🏋️', 'silver', 'uncommon'),
('Gym Warrior', 'Complete 100 workouts', 'workout_milestone', '{"workout_count": 100}', 300, '⚡', 'gold', 'rare'),
('Beast Mode', 'Complete 500 workouts', 'workout_milestone', '{"workout_count": 500}', 1000, '🔥', 'platinum', 'epic'),
('3-Day Streak', 'Maintain a 3-day workout streak', 'streak_milestone', '{"streak_days": 3}', 25, '📈', 'bronze', 'common'),
('Week Strong', 'Maintain a 7-day workout streak', 'streak_milestone', '{"streak_days": 7}', 75, '📊', 'silver', 'uncommon'),
('Unstoppable', 'Maintain a 30-day workout streak', 'streak_milestone', '{"streak_days": 30}', 300, '🔝', 'gold', 'rare'),
('Machine Master', 'Use 20 different machines', 'stats_milestone', '{"unique_machines": 20}', 100, '🤖', 'silver', 'uncommon'),
('Total Volume King', 'Lift a total of 100,000 lbs', 'stats_milestone', '{"total_weight": 100000}', 250, '🏆', 'gold', 'rare');

-- Create function to award coins for completed challenges/achievements
CREATE OR REPLACE FUNCTION public.award_challenge_coins(_user_id UUID, _amount INTEGER, _reference_id UUID, _type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Use existing add_tap_coins function
  RETURN public.add_tap_coins(
    _user_id := _user_id,
    _amount := _amount,
    _transaction_type := _type,
    _description := 'Challenge/Achievement reward',
    _reference_id := _reference_id
  );
END;
$function$;