-- Create workout logs table to track completed workouts
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scheduled_workout_id UUID REFERENCES public.scheduled_workouts(id),
  workout_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  completed_exercises INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for workout logs
CREATE POLICY "Users can view their own workout logs" 
ON public.workout_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout logs" 
ON public.workout_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" 
ON public.workout_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
ON public.workout_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create exercise logs table to track individual exercise completion
CREATE TABLE public.exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  machine_name TEXT,
  sets_completed INTEGER NOT NULL DEFAULT 0,
  reps_completed INTEGER NOT NULL DEFAULT 0,
  weight_used INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise logs
CREATE POLICY "Users can view their own exercise logs" 
ON public.exercise_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise logs" 
ON public.exercise_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise logs" 
ON public.exercise_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise logs" 
ON public.exercise_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on workout_logs
CREATE TRIGGER update_workout_logs_updated_at
BEFORE UPDATE ON public.workout_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get today's workout progress for a user
CREATE OR REPLACE FUNCTION public.get_todays_workout_progress(
  _user_id UUID
)
RETURNS TABLE (
  total_exercises INTEGER,
  completed_exercises INTEGER,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(wl.total_exercises), 0)::INTEGER as total_exercises,
    COALESCE(SUM(wl.completed_exercises), 0)::INTEGER as completed_exercises,
    CASE 
      WHEN COALESCE(SUM(wl.total_exercises), 0) = 0 THEN 0::NUMERIC
      ELSE ROUND((COALESCE(SUM(wl.completed_exercises), 0)::NUMERIC / COALESCE(SUM(wl.total_exercises), 1)::NUMERIC) * 100, 2)
    END as completion_percentage
  FROM public.workout_logs wl
  WHERE wl.user_id = _user_id 
    AND DATE(wl.started_at) = CURRENT_DATE;
END;
$$;