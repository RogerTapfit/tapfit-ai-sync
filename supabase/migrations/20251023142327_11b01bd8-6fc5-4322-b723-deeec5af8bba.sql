-- Create run_sessions table for GPS-tracked runs
CREATE TABLE IF NOT EXISTS public.run_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  total_distance_m NUMERIC NOT NULL DEFAULT 0,
  moving_time_s INTEGER NOT NULL DEFAULT 0,
  elapsed_time_s INTEGER NOT NULL DEFAULT 0,
  avg_pace_sec_per_km NUMERIC NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('km', 'mi')),
  notes TEXT,
  elevation_gain_m NUMERIC DEFAULT 0,
  elevation_loss_m NUMERIC DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'gps',
  route_points JSONB DEFAULT '[]'::jsonb,
  splits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.run_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own runs
CREATE POLICY "Users can view their own runs"
ON public.run_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own runs
CREATE POLICY "Users can create their own runs"
ON public.run_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own runs
CREATE POLICY "Users can update their own runs"
ON public.run_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own runs
CREATE POLICY "Users can delete their own runs"
ON public.run_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_run_sessions_user_id ON public.run_sessions(user_id);
CREATE INDEX idx_run_sessions_started_at ON public.run_sessions(started_at DESC);
CREATE INDEX idx_run_sessions_status ON public.run_sessions(status);

-- Create trigger for updated_at
CREATE TRIGGER update_run_sessions_updated_at
BEFORE UPDATE ON public.run_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();