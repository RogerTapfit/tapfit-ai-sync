-- Add new fields to profiles table for enhanced user profiling
ALTER TABLE public.profiles 
ADD COLUMN age INTEGER,
ADD COLUMN experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN current_max_weights JSONB DEFAULT '{}',
ADD COLUMN preferred_equipment_type TEXT DEFAULT 'mixed' CHECK (preferred_equipment_type IN ('machines', 'free_weights', 'bodyweight', 'mixed')),
ADD COLUMN primary_goal TEXT DEFAULT 'general_fitness' CHECK (primary_goal IN ('fat_loss', 'muscle_building', 'general_fitness', 'strength_training'));

-- Create workout_performance table to track user progress and feedback
CREATE TABLE public.workout_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_exercise_id UUID NOT NULL,
  scheduled_workout_id UUID NOT NULL,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  completed_reps INTEGER NOT NULL DEFAULT 0,
  actual_weight INTEGER,
  recommended_weight INTEGER,
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 5),
  completion_percentage NUMERIC DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weight_progressions table for historical weight tracking
CREATE TABLE public.weight_progressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  machine_name TEXT,
  previous_weight INTEGER,
  new_weight INTEGER NOT NULL,
  progression_reason TEXT CHECK (progression_reason IN ('automatic_increase', 'manual_adjustment', 'plateau_detected', 'performance_decrease')),
  week_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.workout_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_progressions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_performance
CREATE POLICY "Users can create their own workout performance records" 
ON public.workout_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout performance records" 
ON public.workout_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout performance records" 
ON public.workout_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for weight_progressions
CREATE POLICY "Users can create their own weight progressions" 
ON public.weight_progressions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own weight progressions" 
ON public.weight_progressions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workout_performance_user_id ON public.workout_performance(user_id);
CREATE INDEX idx_workout_performance_scheduled_workout ON public.workout_performance(scheduled_workout_id);
CREATE INDEX idx_weight_progressions_user_exercise ON public.weight_progressions(user_id, exercise_name);
CREATE INDEX idx_weight_progressions_created_at ON public.weight_progressions(created_at);