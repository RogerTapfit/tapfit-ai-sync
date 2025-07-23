-- Create power level tracking tables
CREATE TABLE public.user_power_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_score INTEGER NOT NULL DEFAULT 0,
  current_tier TEXT NOT NULL DEFAULT 'inactive',
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create power level history for tracking progress
CREATE TABLE public.power_level_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  tier TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  factors JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_power_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_level_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_power_levels
CREATE POLICY "Users can view their own power level" 
ON public.user_power_levels 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own power level" 
ON public.user_power_levels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own power level" 
ON public.user_power_levels 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for power_level_history
CREATE POLICY "Users can view their own power level history" 
ON public.power_level_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own power level history" 
ON public.power_level_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to calculate power level
CREATE OR REPLACE FUNCTION public.calculate_user_power_level(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  workout_score INTEGER := 0;
  nutrition_score INTEGER := 0;
  consistency_score INTEGER := 0;
  challenge_score INTEGER := 0;
  total_score INTEGER := 0;
  workout_count INTEGER;
  nutrition_days INTEGER;
  streak_days INTEGER;
  completed_challenges INTEGER;
BEGIN
  -- Calculate workout score (0-400 points)
  SELECT COUNT(*)
  INTO workout_count
  FROM public.smart_pin_data
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  workout_score := LEAST(400, workout_count * 15);

  -- Calculate nutrition score (0-200 points)
  SELECT COUNT(DISTINCT logged_date)
  INTO nutrition_days
  FROM public.food_entries
  WHERE user_id = _user_id
    AND logged_date >= CURRENT_DATE - INTERVAL '30 days';
  
  nutrition_score := LEAST(200, nutrition_days * 7);

  -- Calculate consistency score (0-250 points)
  -- This is a simplified streak calculation
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO streak_days
  FROM public.smart_pin_data
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '14 days';
  
  consistency_score := LEAST(250, streak_days * 18);

  -- Calculate challenge score (0-150 points)
  SELECT COUNT(*)
  INTO completed_challenges
  FROM public.user_challenges
  WHERE user_id = _user_id
    AND status = 'completed'
    AND completed_at >= CURRENT_DATE - INTERVAL '30 days';
  
  challenge_score := LEAST(150, completed_challenges * 25);

  -- Calculate total score
  total_score := workout_score + nutrition_score + consistency_score + challenge_score;
  
  RETURN LEAST(1000, total_score);
END;
$$;

-- Create function to get power level tier
CREATE OR REPLACE FUNCTION public.get_power_level_tier(_score INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _score >= 800 THEN 'elite'
    WHEN _score >= 600 THEN 'strong'
    WHEN _score >= 400 THEN 'improving'
    WHEN _score >= 200 THEN 'inconsistent'
    ELSE 'inactive'
  END;
$$;

-- Create function to update user power level
CREATE OR REPLACE FUNCTION public.update_user_power_level(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_score INTEGER;
  new_tier TEXT;
  score_factors JSONB;
BEGIN
  -- Calculate new score
  new_score := public.calculate_user_power_level(_user_id);
  new_tier := public.get_power_level_tier(new_score);
  
  -- Create factors breakdown for history
  score_factors := jsonb_build_object(
    'workout_days', (
      SELECT COUNT(DISTINCT DATE(created_at))
      FROM public.smart_pin_data
      WHERE user_id = _user_id AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'nutrition_days', (
      SELECT COUNT(DISTINCT logged_date)
      FROM public.food_entries
      WHERE user_id = _user_id AND logged_date >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'completed_challenges', (
      SELECT COUNT(*)
      FROM public.user_challenges
      WHERE user_id = _user_id AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    )
  );

  -- Update or insert power level
  INSERT INTO public.user_power_levels (user_id, current_score, current_tier, last_calculated_at)
  VALUES (_user_id, new_score, new_tier, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    current_score = EXCLUDED.current_score,
    current_tier = EXCLUDED.current_tier,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();

  -- Insert into history
  INSERT INTO public.power_level_history (user_id, score, tier, factors)
  VALUES (_user_id, new_score, new_tier, score_factors);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Add unique constraint for user_power_levels
ALTER TABLE public.user_power_levels ADD CONSTRAINT user_power_levels_user_id_key UNIQUE (user_id);

-- Create trigger to update power level after workouts
CREATE OR REPLACE FUNCTION public.trigger_power_level_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update power level for the user
  PERFORM public.update_user_power_level(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create triggers for power level updates
CREATE TRIGGER update_power_level_after_workout
  AFTER INSERT OR UPDATE ON public.smart_pin_data
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_power_level_update();

CREATE TRIGGER update_power_level_after_nutrition
  AFTER INSERT OR UPDATE ON public.food_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_power_level_update();

CREATE TRIGGER update_power_level_after_challenge
  AFTER UPDATE ON public.user_challenges
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.trigger_power_level_update();