-- Create swim_sessions table
CREATE TABLE public.swim_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  total_distance_m NUMERIC NOT NULL DEFAULT 0,
  moving_time_s INTEGER NOT NULL DEFAULT 0,
  elapsed_time_s INTEGER NOT NULL DEFAULT 0,
  avg_pace_sec_per_100m NUMERIC NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('yd', 'm')) DEFAULT 'm',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  laps JSONB DEFAULT '[]'::jsonb,
  training_mode TEXT,
  target_hr_zone JSONB,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  time_in_zone_s INTEGER DEFAULT 0,
  hr_samples JSONB DEFAULT '[]'::jsonb,
  stroke_type TEXT CHECK (stroke_type IN ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed')),
  pool_length_m NUMERIC,
  total_laps INTEGER DEFAULT 0,
  avg_strokes_per_lap NUMERIC,
  swolf_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.swim_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own swim sessions" 
ON public.swim_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own swim sessions" 
ON public.swim_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own swim sessions" 
ON public.swim_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swim sessions" 
ON public.swim_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_swim_sessions_user_id ON public.swim_sessions(user_id);
CREATE INDEX idx_swim_sessions_started_at ON public.swim_sessions(started_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_swim_sessions_updated_at
BEFORE UPDATE ON public.swim_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
