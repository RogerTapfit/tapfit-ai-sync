-- Create screen_time_bank table for tracking earned/used screen time
CREATE TABLE public.screen_time_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earned_minutes INTEGER NOT NULL DEFAULT 0,
  used_minutes INTEGER NOT NULL DEFAULT 0,
  push_ups_per_minute INTEGER NOT NULL DEFAULT 5,
  last_earning_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create screen_time_sessions table for tracking usage sessions
CREATE TABLE public.screen_time_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  minutes_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screen_time_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_time_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for screen_time_bank
CREATE POLICY "Users can view their own screen time bank"
  ON public.screen_time_bank FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screen time bank"
  ON public.screen_time_bank FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screen time bank"
  ON public.screen_time_bank FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for screen_time_sessions
CREATE POLICY "Users can view their own screen time sessions"
  ON public.screen_time_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screen time sessions"
  ON public.screen_time_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screen time sessions"
  ON public.screen_time_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own screen time sessions"
  ON public.screen_time_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_screen_time_bank_user_id ON public.screen_time_bank(user_id);
CREATE INDEX idx_screen_time_sessions_user_id ON public.screen_time_sessions(user_id);
CREATE INDEX idx_screen_time_sessions_platform ON public.screen_time_sessions(platform);
CREATE INDEX idx_screen_time_sessions_started_at ON public.screen_time_sessions(started_at);