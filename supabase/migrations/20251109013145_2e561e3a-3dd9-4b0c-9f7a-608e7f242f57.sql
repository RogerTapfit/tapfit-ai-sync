-- Create table to store learned rest time preferences per exercise
CREATE TABLE IF NOT EXISTS public.exercise_rest_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  machine_name TEXT NOT NULL,
  preferred_rest_seconds INTEGER NOT NULL DEFAULT 60,
  total_samples INTEGER NOT NULL DEFAULT 0,
  avg_actual_rest_seconds INTEGER NOT NULL DEFAULT 60,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

-- Enable Row Level Security
ALTER TABLE public.exercise_rest_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own rest preferences" 
ON public.exercise_rest_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rest preferences" 
ON public.exercise_rest_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rest preferences" 
ON public.exercise_rest_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rest preferences" 
ON public.exercise_rest_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_exercise_rest_preferences_user_exercise 
ON public.exercise_rest_preferences(user_id, exercise_name);

-- Add column to exercise_logs to track actual rest time taken
ALTER TABLE public.exercise_logs 
ADD COLUMN IF NOT EXISTS actual_rest_seconds INTEGER;

COMMENT ON TABLE public.exercise_rest_preferences IS 'Stores learned rest time preferences per user per exercise';
COMMENT ON COLUMN public.exercise_rest_preferences.preferred_rest_seconds IS 'Suggested rest time based on learning';
COMMENT ON COLUMN public.exercise_rest_preferences.avg_actual_rest_seconds IS 'Average rest time actually taken';
COMMENT ON COLUMN public.exercise_rest_preferences.total_samples IS 'Number of workouts used for learning';
COMMENT ON COLUMN public.exercise_logs.actual_rest_seconds IS 'Actual rest time taken between sets';