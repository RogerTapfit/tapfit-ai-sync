-- Create mood_entries table for self-reported mood and energy data
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
  mood_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  entry_context TEXT DEFAULT 'general',
  heart_rate_bpm INTEGER,
  sleep_hours_last_night NUMERIC(4,2),
  sleep_quality_last_night INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date, entry_context)
);

-- Create workout_performance_correlations table
CREATE TABLE public.workout_performance_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  sleep_duration_correlation NUMERIC(5,3),
  sleep_quality_correlation NUMERIC(5,3),
  mood_score_correlation NUMERIC(5,3),
  energy_level_correlation NUMERIC(5,3),
  stress_level_correlation NUMERIC(5,3),
  resting_hr_correlation NUMERIC(5,3),
  optimal_sleep_hours NUMERIC(4,2),
  optimal_sleep_quality INTEGER,
  optimal_mood_range JSONB DEFAULT '{"min": 6, "max": 10}',
  optimal_energy_range JSONB DEFAULT '{"min": 6, "max": 10}',
  optimal_stress_range JSONB DEFAULT '{"min": 1, "max": 4}',
  optimal_resting_hr JSONB DEFAULT '{"min": 50, "max": 70}',
  best_workout_time TEXT,
  best_workout_day TEXT,
  data_points_count INTEGER DEFAULT 0,
  confidence_level TEXT DEFAULT 'low',
  last_calculated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create biometric_insights table for AI-generated insights
CREATE TABLE public.biometric_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  confidence_score NUMERIC(3,2),
  data_source TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_actionable BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_performance_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for mood_entries
CREATE POLICY "Users can view their own mood entries"
  ON public.mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries"
  ON public.mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
  ON public.mood_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
  ON public.mood_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for workout_performance_correlations
CREATE POLICY "Users can view their own correlations"
  ON public.workout_performance_correlations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own correlations"
  ON public.workout_performance_correlations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own correlations"
  ON public.workout_performance_correlations FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for biometric_insights
CREATE POLICY "Users can view their own insights"
  ON public.biometric_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights"
  ON public.biometric_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.biometric_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.biometric_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for efficient querying
CREATE INDEX idx_mood_entries_user_date ON public.mood_entries(user_id, entry_date DESC);
CREATE INDEX idx_mood_entries_context ON public.mood_entries(user_id, entry_context);
CREATE INDEX idx_biometric_insights_user ON public.biometric_insights(user_id, created_at DESC);
CREATE INDEX idx_biometric_insights_unread ON public.biometric_insights(user_id, is_read) WHERE is_read = false;

-- Function to calculate readiness score
CREATE OR REPLACE FUNCTION public.calculate_readiness_score(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sleep_score INTEGER := 50;
  mood_score INTEGER := 50;
  stress_score INTEGER := 50;
  recovery_score INTEGER := 50;
  total_score INTEGER;
  last_sleep RECORD;
  today_mood RECORD;
BEGIN
  -- Get last night's sleep
  SELECT duration_minutes, quality_score INTO last_sleep
  FROM sleep_logs
  WHERE user_id = _user_id
  ORDER BY sleep_date DESC
  LIMIT 1;
  
  IF last_sleep IS NOT NULL THEN
    -- Sleep score based on 7-9 hours optimal
    IF last_sleep.duration_minutes >= 420 AND last_sleep.duration_minutes <= 540 THEN
      sleep_score := 100;
    ELSIF last_sleep.duration_minutes >= 360 THEN
      sleep_score := 80;
    ELSIF last_sleep.duration_minutes >= 300 THEN
      sleep_score := 60;
    ELSE
      sleep_score := 40;
    END IF;
    
    -- Adjust by quality
    IF last_sleep.quality_score IS NOT NULL THEN
      sleep_score := (sleep_score + (last_sleep.quality_score * 20)) / 2;
    END IF;
  END IF;
  
  -- Get today's mood
  SELECT me.mood_score AS mood, me.energy_level AS energy, me.stress_level AS stress 
  INTO today_mood
  FROM mood_entries me
  WHERE me.user_id = _user_id AND me.entry_date = CURRENT_DATE
  ORDER BY me.created_at DESC
  LIMIT 1;
  
  IF today_mood IS NOT NULL THEN
    mood_score := COALESCE(today_mood.mood, 5) * 10;
    stress_score := (11 - COALESCE(today_mood.stress, 5)) * 10; -- Invert stress
    recovery_score := COALESCE(today_mood.energy, 5) * 10;
  END IF;
  
  -- Calculate total
  total_score := (sleep_score + mood_score + stress_score + recovery_score) / 4;
  
  RETURN jsonb_build_object(
    'total', total_score,
    'sleep', sleep_score,
    'mood', mood_score,
    'stress', stress_score,
    'recovery', recovery_score,
    'status', CASE 
      WHEN total_score >= 70 THEN 'optimal'
      WHEN total_score >= 50 THEN 'moderate'
      ELSE 'low'
    END
  );
END;
$$;