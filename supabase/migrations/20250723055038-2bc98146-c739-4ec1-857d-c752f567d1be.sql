-- Create workout_sessions table to group smart pin data
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user session access
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sessions" 
ON public.workout_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add session_id field to smart_pin_data table
ALTER TABLE public.smart_pin_data 
ADD COLUMN session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_start_time ON public.workout_sessions(start_time DESC);
CREATE INDEX idx_smart_pin_data_session_id ON public.smart_pin_data(session_id);

-- Enable real-time updates for workout_sessions
ALTER TABLE public.workout_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;