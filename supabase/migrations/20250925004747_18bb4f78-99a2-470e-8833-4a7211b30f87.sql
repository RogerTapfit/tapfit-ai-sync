-- Create enum for cycle phases
CREATE TYPE cycle_phase AS ENUM ('menstrual', 'follicular', 'ovulation', 'luteal');

-- Create cycle tracking table
CREATE TABLE public.cycle_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  average_cycle_length INTEGER NOT NULL DEFAULT 28,
  average_period_length INTEGER NOT NULL DEFAULT 5,
  last_period_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cycle_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for cycle tracking
CREATE POLICY "Users can view their own cycle data" 
ON public.cycle_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cycle data" 
ON public.cycle_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycle data" 
ON public.cycle_tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cycle data" 
ON public.cycle_tracking 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_cycle_tracking_updated_at
BEFORE UPDATE ON public.cycle_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate cycle phase
CREATE OR REPLACE FUNCTION public.get_cycle_phase(_last_period_start DATE, _cycle_length INTEGER, _period_length INTEGER, _target_date DATE)
RETURNS cycle_phase
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  days_since_period INTEGER;
  cycle_day INTEGER;
  ovulation_day INTEGER;
  fertile_start INTEGER;
  fertile_end INTEGER;
BEGIN
  -- Calculate days since last period start
  days_since_period := _target_date - _last_period_start;
  
  -- Handle negative days (before period start)
  IF days_since_period < 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate cycle day (1-based, wrapping around cycle length)
  cycle_day := (days_since_period % _cycle_length) + 1;
  
  -- Calculate key cycle days
  ovulation_day := _cycle_length - 14; -- Typically 14 days before next period
  fertile_start := ovulation_day - 5;  -- 5 days before ovulation
  fertile_end := ovulation_day + 1;    -- 1 day after ovulation
  
  -- Determine phase
  IF cycle_day <= _period_length THEN
    RETURN 'menstrual'::cycle_phase;
  ELSIF cycle_day <= fertile_start THEN
    RETURN 'follicular'::cycle_phase;
  ELSIF cycle_day >= fertile_start AND cycle_day <= fertile_end THEN
    IF cycle_day = ovulation_day THEN
      RETURN 'ovulation'::cycle_phase;
    ELSE
      RETURN 'follicular'::cycle_phase; -- Fertile window but not ovulation day
    END IF;
  ELSE
    RETURN 'luteal'::cycle_phase;
  END IF;
END;
$function$;

-- Create function to get cycle insights
CREATE OR REPLACE FUNCTION public.get_cycle_insights(_phase cycle_phase)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE _phase
    WHEN 'menstrual' THEN jsonb_build_object(
      'energy_level', 'low',
      'calorie_adjustment', 0,
      'workout_recommendations', jsonb_build_array('yoga', 'walking', 'stretching', 'light_cardio'),
      'nutrition_tips', jsonb_build_array('iron_rich_foods', 'hydration', 'magnesium', 'comfort_foods_ok'),
      'phase_description', 'Energy is lower. Focus on gentle movement and nourishing foods.'
    )
    WHEN 'follicular' THEN jsonb_build_object(
      'energy_level', 'high',
      'calorie_adjustment', 0,
      'workout_recommendations', jsonb_build_array('hiit', 'strength_training', 'cardio', 'new_challenges'),
      'nutrition_tips', jsonb_build_array('protein_support', 'complex_carbs', 'normal_intake'),
      'phase_description', 'Peak energy phase! Great time for intense workouts and trying new challenges.'
    )
    WHEN 'ovulation' THEN jsonb_build_object(
      'energy_level', 'peak',
      'calorie_adjustment', 0,
      'workout_recommendations', jsonb_build_array('pr_attempts', 'max_strength', 'hiit', 'competitions'),
      'nutrition_tips', jsonb_build_array('hydration', 'recovery_foods', 'antioxidants'),
      'phase_description', 'Strongest performance window! Perfect time for personal records and competitions.'
    )
    WHEN 'luteal' THEN jsonb_build_object(
      'energy_level', 'moderate',
      'calorie_adjustment', 200,
      'workout_recommendations', jsonb_build_array('steady_cardio', 'moderate_strength', 'flexibility', 'pilates'),
      'nutrition_tips', jsonb_build_array('higher_calories', 'healthy_cravings', 'complex_carbs', 'fiber'),
      'phase_description', 'Higher metabolism (+100-300 cal/day). Expect increased hunger - this is normal!'
    )
    ELSE jsonb_build_object()
  END;
END;
$function$;