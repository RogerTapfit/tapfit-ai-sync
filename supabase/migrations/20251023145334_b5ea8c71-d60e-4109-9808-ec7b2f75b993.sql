-- Create ride_sessions table for cycling tracking
CREATE TABLE public.ride_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  total_distance_m INTEGER NOT NULL DEFAULT 0,
  moving_time_s INTEGER NOT NULL DEFAULT 0,
  elapsed_time_s INTEGER NOT NULL DEFAULT 0,
  avg_speed_kmh NUMERIC(5,2),
  max_speed_kmh NUMERIC(5,2),
  calories INTEGER,
  unit TEXT NOT NULL CHECK (unit IN ('km', 'mi')),
  notes TEXT,
  elevation_gain_m INTEGER,
  elevation_loss_m INTEGER,
  source TEXT NOT NULL DEFAULT 'gps',
  splits JSONB,
  points JSONB,
  auto_pause_enabled BOOLEAN DEFAULT true,
  audio_cues_enabled BOOLEAN DEFAULT true,
  
  -- Heart Rate Training
  training_mode TEXT,
  target_hr_zone JSONB,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  time_in_zone_s INTEGER,
  hr_samples JSONB,
  
  -- Cycling-specific
  avg_cadence INTEGER,
  ride_type TEXT CHECK (ride_type IN ('road', 'mountain', 'indoor', 'commute')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_ride_sessions_user_id ON public.ride_sessions(user_id);
CREATE INDEX idx_ride_sessions_started_at ON public.ride_sessions(started_at DESC);
CREATE INDEX idx_ride_sessions_status ON public.ride_sessions(status);

-- Enable RLS
ALTER TABLE public.ride_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own rides"
  ON public.ride_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rides"
  ON public.ride_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rides"
  ON public.ride_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rides"
  ON public.ride_sessions FOR DELETE
  USING (auth.uid() = user_id);