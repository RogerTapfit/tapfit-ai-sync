-- Create cardio-related tables for the prescription engine

-- Cardio sessions table
CREATE TABLE public.cardio_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_type TEXT NOT NULL CHECK (machine_type IN ('treadmill', 'bike', 'stair_stepper', 'elliptical', 'rower')),
  goal TEXT NOT NULL CHECK (goal IN ('endurance', 'calories', 'intervals', 'recovery')),
  target_load INTEGER NOT NULL DEFAULT 0,
  target_zone TEXT NOT NULL,
  planned_duration INTEGER NOT NULL DEFAULT 30,
  actual_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Cardio blocks table (workout segments)
CREATE TABLE public.cardio_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cardio_sessions(id) ON DELETE CASCADE,
  block_order INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  target_hrr_min NUMERIC(4,3) NOT NULL,
  target_hrr_max NUMERIC(4,3) NOT NULL,
  machine_settings JSONB NOT NULL DEFAULT '{}',
  block_type TEXT NOT NULL CHECK (block_type IN ('warmup', 'work', 'rest', 'cooldown')),
  actual_duration INTEGER,
  actual_hr_avg INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Heart rate data for real-time tracking
CREATE TABLE public.heart_rate_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cardio_sessions(id) ON DELETE CASCADE,
  timestamp_offset INTEGER NOT NULL, -- seconds from session start
  heart_rate_bpm INTEGER NOT NULL,
  hrr_percent NUMERIC(4,3),
  target_hrr_percent NUMERIC(4,3),
  machine_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session recordings (final results)
CREATE TABLE public.session_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cardio_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_min INTEGER NOT NULL,
  distance NUMERIC(8,2),
  elevation_gain NUMERIC(8,2),
  avg_speed NUMERIC(6,2),
  avg_level INTEGER,
  hr_avg INTEGER NOT NULL,
  hr_max INTEGER NOT NULL,
  cadence_avg INTEGER,
  watts_avg INTEGER,
  rpe INTEGER NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  trimp_score INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  z1_minutes INTEGER NOT NULL DEFAULT 0,
  z2_minutes INTEGER NOT NULL DEFAULT 0,
  z3_minutes INTEGER NOT NULL DEFAULT 0,
  z4_minutes INTEGER NOT NULL DEFAULT 0,
  z5_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Machine calibration constants
CREATE TABLE public.machine_calibrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id TEXT NOT NULL,
  machine_type TEXT NOT NULL CHECK (machine_type IN ('treadmill', 'bike', 'stair_stepper', 'elliptical', 'rower')),
  calibration_constant NUMERIC(6,4) NOT NULL DEFAULT 1.0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_count INTEGER NOT NULL DEFAULT 0,
  accuracy_score NUMERIC(4,3) NOT NULL DEFAULT 0.5,
  gym_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(machine_id, machine_type)
);

-- Add cardio-specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN hr_rest INTEGER DEFAULT 60,
ADD COLUMN hr_max INTEGER,
ADD COLUMN ftp_watts INTEGER,
ADD COLUMN vo2max_velocity NUMERIC(4,1);

-- Indexes for performance
CREATE INDEX idx_cardio_sessions_user_created ON public.cardio_sessions(user_id, created_at DESC);
CREATE INDEX idx_cardio_blocks_session_order ON public.cardio_blocks(session_id, block_order);
CREATE INDEX idx_heart_rate_data_session_time ON public.heart_rate_data(session_id, timestamp_offset);
CREATE INDEX idx_session_recordings_user_created ON public.session_recordings(user_id, created_at DESC);
CREATE INDEX idx_machine_calibrations_type_machine ON public.machine_calibrations(machine_type, machine_id);

-- Enable RLS
ALTER TABLE public.cardio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_rate_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_calibrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cardio_sessions
CREATE POLICY "Users can manage their own cardio sessions"
ON public.cardio_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cardio_blocks
CREATE POLICY "Users can manage their cardio blocks"
ON public.cardio_blocks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cardio_sessions cs 
    WHERE cs.id = cardio_blocks.session_id 
    AND cs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cardio_sessions cs 
    WHERE cs.id = cardio_blocks.session_id 
    AND cs.user_id = auth.uid()
  )
);

-- RLS Policies for heart_rate_data
CREATE POLICY "Users can manage their heart rate data"
ON public.heart_rate_data
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cardio_sessions cs 
    WHERE cs.id = heart_rate_data.session_id 
    AND cs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cardio_sessions cs 
    WHERE cs.id = heart_rate_data.session_id 
    AND cs.user_id = auth.uid()
  )
);

-- RLS Policies for session_recordings
CREATE POLICY "Users can manage their session recordings"
ON public.session_recordings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for machine_calibrations
CREATE POLICY "Anyone can view machine calibrations"
ON public.machine_calibrations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can manage machine calibrations"
ON public.machine_calibrations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to calculate HR max if not set
CREATE OR REPLACE FUNCTION public.calculate_hr_max_if_needed()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate HR max using formula: 208 - (0.7 * age)
  IF NEW.hr_max IS NULL AND NEW.age IS NOT NULL THEN
    NEW.hr_max := ROUND(208 - (0.7 * NEW.age));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate HR max
CREATE TRIGGER calculate_hr_max_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_hr_max_if_needed();