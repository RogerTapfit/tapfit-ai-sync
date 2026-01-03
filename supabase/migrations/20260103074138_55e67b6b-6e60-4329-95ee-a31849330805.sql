-- Create fasting_sessions table for tracking individual fasts
CREATE TABLE public.fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fast_type TEXT NOT NULL, -- '16:8', '18:6', '20:4', 'OMAD', 'alternate_day', 'water_fast', 'liquid_fast', '36_hour', '48_hour', 'custom'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  target_end_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'broken', 'cancelled')),
  target_hours INTEGER NOT NULL,
  actual_hours NUMERIC(5,2),
  allow_liquids BOOLEAN DEFAULT true,
  allow_zero_cal BOOLEAN DEFAULT true,
  break_reason TEXT,
  notes TEXT,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fasting_goals table for user preferences
CREATE TABLE public.fasting_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_protocol TEXT DEFAULT '16:8',
  weekly_target_fasts INTEGER DEFAULT 5,
  preferred_eating_window_start TIME DEFAULT '12:00:00',
  preferred_eating_window_end TIME DEFAULT '20:00:00',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fasting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasting_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for fasting_sessions
CREATE POLICY "Users can view their own fasting sessions"
ON public.fasting_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fasting sessions"
ON public.fasting_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fasting sessions"
ON public.fasting_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fasting sessions"
ON public.fasting_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for fasting_goals
CREATE POLICY "Users can view their own fasting goals"
ON public.fasting_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fasting goals"
ON public.fasting_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fasting goals"
ON public.fasting_goals FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_fasting_sessions_user_id ON public.fasting_sessions(user_id);
CREATE INDEX idx_fasting_sessions_status ON public.fasting_sessions(status);
CREATE INDEX idx_fasting_sessions_started_at ON public.fasting_sessions(started_at DESC);
CREATE INDEX idx_fasting_goals_user_id ON public.fasting_goals(user_id);

-- Function to award coins for completed fasts
CREATE OR REPLACE FUNCTION public.award_fasting_coins(_user_id uuid, _session_id uuid, _actual_hours numeric, _target_hours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _coins_to_award INTEGER;
  _completion_bonus INTEGER := 0;
  _streak_bonus INTEGER := 0;
  _streak_count INTEGER;
BEGIN
  -- Base coins: 5 coins per hour fasted
  _coins_to_award := FLOOR(_actual_hours * 5);
  
  -- Completion bonus if target reached
  IF _actual_hours >= _target_hours THEN
    _completion_bonus := CASE
      WHEN _target_hours >= 48 THEN 200
      WHEN _target_hours >= 36 THEN 150
      WHEN _target_hours >= 24 THEN 100
      WHEN _target_hours >= 20 THEN 75
      WHEN _target_hours >= 18 THEN 50
      WHEN _target_hours >= 16 THEN 40
      ELSE 25
    END;
  END IF;
  
  -- Check for fasting streak (consecutive days with completed fasts)
  SELECT COUNT(*) INTO _streak_count
  FROM (
    SELECT DATE(started_at) as fast_date
    FROM public.fasting_sessions
    WHERE user_id = _user_id
      AND status = 'completed'
      AND started_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(started_at)
  ) as daily_fasts;
  
  -- Streak bonus
  IF _streak_count >= 7 THEN
    _streak_bonus := 100;
  ELSIF _streak_count >= 5 THEN
    _streak_bonus := 50;
  ELSIF _streak_count >= 3 THEN
    _streak_bonus := 25;
  END IF;
  
  _coins_to_award := _coins_to_award + _completion_bonus + _streak_bonus;
  
  -- Award coins using existing function
  PERFORM public.add_tap_coins(
    _user_id,
    _coins_to_award,
    'fasting_completed',
    'Completed ' || _actual_hours || 'h fast (' || 
      CASE WHEN _completion_bonus > 0 THEN 'target reached!' ELSE 'partial' END || ')'
  );
  
  -- Update the session with coins earned
  UPDATE public.fasting_sessions
  SET coins_earned = _coins_to_award
  WHERE id = _session_id;
  
  RETURN _coins_to_award;
END;
$$;