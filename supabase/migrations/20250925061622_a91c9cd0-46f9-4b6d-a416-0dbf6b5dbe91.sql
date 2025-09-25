-- Monthly workout templates table
CREATE TABLE public.monthly_workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('fat_loss', 'muscle_building', 'general_fitness', 'strength_training')),
  template_data JSONB NOT NULL DEFAULT '{}',
  week_structure JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Workout adaptations tracking
CREATE TABLE public.workout_adaptations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_plan_id UUID NOT NULL,
  adaptation_week INTEGER NOT NULL,
  nutrition_trigger JSONB,
  performance_trigger JSONB,
  adaptation_applied JSONB NOT NULL,
  adaptation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User calibration results
CREATE TABLE public.user_calibration_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  calibration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  strength_metrics JSONB NOT NULL DEFAULT '{}',
  endurance_metrics JSONB NOT NULL DEFAULT '{}',
  baseline_weights JSONB NOT NULL DEFAULT '{}',
  fitness_assessment TEXT,
  recommendations JSONB,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monthly workout progress tracking
CREATE TABLE public.monthly_workout_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_plan_id UUID NOT NULL,
  current_week INTEGER NOT NULL DEFAULT 1,
  weekly_adaptations JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  nutrition_compliance JSONB DEFAULT '{}',
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced exercise database
CREATE TABLE public.exercise_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name TEXT NOT NULL,
  machine_name TEXT,
  muscle_groups TEXT[] NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'compound', 'isolation')),
  equipment_category TEXT NOT NULL CHECK (equipment_category IN ('machine', 'free_weights', 'cardio', 'bodyweight')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  form_instructions TEXT,
  progression_notes TEXT,
  calorie_burn_rate NUMERIC DEFAULT 5.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.monthly_workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calibration_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_database ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active workout templates" ON public.monthly_workout_templates
FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own workout adaptations" ON public.workout_adaptations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout adaptations" ON public.workout_adaptations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own calibration results" ON public.user_calibration_results
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calibration results" ON public.user_calibration_results
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calibration results" ON public.user_calibration_results
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own monthly progress" ON public.monthly_workout_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly progress" ON public.monthly_workout_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly progress" ON public.monthly_workout_progress
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view active exercises" ON public.exercise_database
FOR SELECT USING (is_active = true);

-- Insert sample exercise data
INSERT INTO public.exercise_database (exercise_name, machine_name, muscle_groups, exercise_type, equipment_category, difficulty_level, form_instructions, progression_notes, calorie_burn_rate) VALUES
('Chest Press', 'Chest Press Machine', ARRAY['chest', 'triceps'], 'compound', 'machine', 'beginner', 'Sit with back flat against pad, grip handles at chest level, press forward smoothly', 'Increase weight by 5-10lbs when completing all sets with good form', 6.0),
('Lat Pulldown', 'Lat Pulldown Machine', ARRAY['lats', 'biceps'], 'compound', 'machine', 'beginner', 'Sit with thighs under pad, grip bar wider than shoulders, pull to upper chest', 'Focus on squeezing shoulder blades together', 5.5),
('Leg Press', 'Leg Press Machine', ARRAY['quadriceps', 'glutes'], 'compound', 'machine', 'beginner', 'Feet shoulder-width apart on platform, lower until 90 degrees, press through heels', 'Can handle heavier weights than squats, good for building strength', 7.0),
('Shoulder Press', 'Shoulder Press Machine', ARRAY['shoulders', 'triceps'], 'compound', 'machine', 'intermediate', 'Sit upright, grip handles at shoulder height, press overhead smoothly', 'Avoid arching back, keep core engaged', 5.0),
('Seated Row', 'Seated Row Machine', ARRAY['lats', 'rhomboids', 'biceps'], 'compound', 'machine', 'beginner', 'Sit with chest against pad, pull handles to torso, squeeze shoulder blades', 'Focus on controlled movement, avoid momentum', 5.5),
('Leg Extension', 'Leg Extension Machine', ARRAY['quadriceps'], 'isolation', 'machine', 'beginner', 'Sit with back against pad, extend legs smoothly, squeeze at top', 'Good for quad isolation, use moderate weight', 4.0),
('Leg Curl', 'Leg Curl Machine', ARRAY['hamstrings'], 'isolation', 'machine', 'beginner', 'Lie face down, curl heels toward glutes, control the negative', 'Balance quad work with hamstring development', 4.0),
('Treadmill Running', 'Treadmill', ARRAY['legs', 'cardiovascular'], 'cardio', 'cardio', 'beginner', 'Start at comfortable pace, maintain good posture, land midfoot', 'Gradually increase speed or incline for progression', 10.0),
('Stationary Bike', 'Exercise Bike', ARRAY['legs', 'cardiovascular'], 'cardio', 'cardio', 'beginner', 'Adjust seat height, maintain 80-90 RPM, keep shoulders relaxed', 'Increase resistance or duration for progression', 8.0),
('Elliptical', 'Elliptical Machine', ARRAY['legs', 'arms', 'cardiovascular'], 'cardio', 'cardio', 'beginner', 'Natural stride motion, engage arms, maintain upright posture', 'Low impact alternative to running', 9.0);

-- Insert sample workout templates
INSERT INTO public.monthly_workout_templates (fitness_level, primary_goal, template_data, week_structure) VALUES
('beginner', 'general_fitness', 
  '{"focus": "foundation_building", "exercises_per_day": 6, "sets_range": [2, 3], "reps_range": [10, 15], "rest_seconds": 60}',
  '{"week1": {"intensity": 0.6}, "week2": {"intensity": 0.65}, "week3": {"intensity": 0.7}, "week4": {"intensity": 0.75}}'
),
('intermediate', 'muscle_building',
  '{"focus": "hypertrophy", "exercises_per_day": 8, "sets_range": [3, 4], "reps_range": [6, 12], "rest_seconds": 75}',
  '{"week1": {"intensity": 0.7}, "week2": {"intensity": 0.75}, "week3": {"intensity": 0.8}, "week4": {"intensity": 0.85}}'
),
('advanced', 'strength_training',
  '{"focus": "strength", "exercises_per_day": 10, "sets_range": [4, 5], "reps_range": [3, 8], "rest_seconds": 120}',
  '{"week1": {"intensity": 0.8}, "week2": {"intensity": 0.85}, "week3": {"intensity": 0.9}, "week4": {"intensity": 0.95}}'
);

-- Update triggers
CREATE TRIGGER update_monthly_templates_updated_at
  BEFORE UPDATE ON public.monthly_workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_progress_updated_at
  BEFORE UPDATE ON public.monthly_workout_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();