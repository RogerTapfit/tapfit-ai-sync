-- Create daily_steps table for step tracking
CREATE TABLE public.daily_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  step_count INTEGER NOT NULL DEFAULT 0,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance_km NUMERIC(5,2),
  calories_burned INTEGER,
  active_minutes INTEGER,
  data_source TEXT DEFAULT 'healthkit',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_steps
CREATE POLICY "Users can view their own daily steps" 
ON public.daily_steps 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily steps" 
ON public.daily_steps 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily steps" 
ON public.daily_steps 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily steps" 
ON public.daily_steps 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate entries per user per day
CREATE UNIQUE INDEX daily_steps_user_date_idx ON public.daily_steps (user_id, recorded_date);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_steps_updated_at
BEFORE UPDATE ON public.daily_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enhance food_entries to ensure better photo storage
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS photo_storage_path TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS analysis_confidence NUMERIC(3,2) DEFAULT 0.85;

-- Create exercise_sets table for detailed set/rep tracking
CREATE TABLE public.exercise_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_log_id UUID NOT NULL,
  set_number INTEGER NOT NULL,
  reps_completed INTEGER NOT NULL DEFAULT 0,
  weight_used INTEGER,
  rest_duration_seconds INTEGER,
  perceived_effort INTEGER CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS for exercise_sets
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise_sets
CREATE POLICY "Users can manage their own exercise sets" 
ON public.exercise_sets 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for exercise_sets
CREATE TRIGGER update_exercise_sets_updated_at
BEFORE UPDATE ON public.exercise_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create daily_activity_summary table for quick calendar display
CREATE TABLE public.daily_activity_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories_burned INTEGER DEFAULT 0,
  total_calories_consumed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  total_workout_minutes INTEGER DEFAULT 0,
  step_count INTEGER DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  workouts_completed INTEGER DEFAULT 0,
  goals_achieved INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for daily_activity_summary
ALTER TABLE public.daily_activity_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_activity_summary
CREATE POLICY "Users can manage their own daily activity summary" 
ON public.daily_activity_summary 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create unique constraint for daily_activity_summary
CREATE UNIQUE INDEX daily_activity_summary_user_date_idx ON public.daily_activity_summary (user_id, activity_date);

-- Add trigger for daily_activity_summary
CREATE TRIGGER update_daily_activity_summary_updated_at
BEFORE UPDATE ON public.daily_activity_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();