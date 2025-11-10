-- Create nutrition_challenges table
CREATE TABLE IF NOT EXISTS public.nutrition_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('best_average_grade', 'meals_above_grade', 'healthy_meal_streak', 'weekly_health_score')),
  target_metric TEXT NOT NULL, -- 'avg_grade', 'meal_count', 'streak_days', 'total_score'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  min_meals_required INTEGER DEFAULT 7, -- Minimum meals to qualify
  coin_reward INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_challenge_participants table
CREATE TABLE IF NOT EXISTS public.nutrition_challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.nutrition_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_meals INTEGER DEFAULT 0,
  meals_above_target INTEGER DEFAULT 0,
  average_grade_score NUMERIC DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  total_health_score NUMERIC DEFAULT 0,
  rank INTEGER,
  coins_earned INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE public.nutrition_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nutrition_challenges
CREATE POLICY "Anyone can view active nutrition challenges"
  ON public.nutrition_challenges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create nutrition challenges"
  ON public.nutrition_challenges
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges"
  ON public.nutrition_challenges
  FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for nutrition_challenge_participants
CREATE POLICY "Users can view their own participation"
  ON public.nutrition_challenge_participants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view participants in challenges they joined"
  ON public.nutrition_challenge_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_challenge_participants ncp
      WHERE ncp.challenge_id = nutrition_challenge_participants.challenge_id
      AND ncp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join challenges"
  ON public.nutrition_challenge_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.nutrition_challenge_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON public.nutrition_challenge_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_nutrition_challenges_dates ON public.nutrition_challenges(start_date, end_date);
CREATE INDEX idx_nutrition_challenge_participants_challenge ON public.nutrition_challenge_participants(challenge_id);
CREATE INDEX idx_nutrition_challenge_participants_user ON public.nutrition_challenge_participants(user_id);
CREATE INDEX idx_nutrition_challenge_participants_rank ON public.nutrition_challenge_participants(challenge_id, rank);

-- Create trigger to update timestamps
CREATE TRIGGER update_nutrition_challenges_updated_at
  BEFORE UPDATE ON public.nutrition_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_challenge_participants_updated_at
  BEFORE UPDATE ON public.nutrition_challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default weekly nutrition challenges
INSERT INTO public.nutrition_challenges (
  name, 
  description, 
  challenge_type, 
  target_metric,
  start_date,
  end_date,
  min_meals_required,
  coin_reward
) VALUES
(
  'Week of Wellness',
  'Achieve the highest average health grade across all meals this week. Minimum 7 meals required.',
  'best_average_grade',
  'avg_grade',
  DATE_TRUNC('week', CURRENT_DATE),
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
  7,
  200
),
(
  'A+ Achiever',
  'Log the most meals with grade A or B this week. Show your commitment to healthy eating!',
  'meals_above_grade',
  'meal_count',
  DATE_TRUNC('week', CURRENT_DATE),
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
  7,
  150
),
(
  'Health Score Champion',
  'Achieve the highest total health score from all your meals combined this week.',
  'weekly_health_score',
  'total_score',
  DATE_TRUNC('week', CURRENT_DATE),
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
  7,
  250
);