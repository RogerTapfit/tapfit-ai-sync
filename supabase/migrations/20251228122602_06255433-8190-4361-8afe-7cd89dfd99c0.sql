-- Create sobriety_tracking table
CREATE TABLE public.sobriety_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  end_date DATE,
  reason_ended TEXT,
  notes TEXT,
  substance_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique partial index to ensure only one active journey per user
CREATE UNIQUE INDEX sobriety_tracking_unique_active ON public.sobriety_tracking (user_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sobriety_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own sobriety tracking" 
  ON public.sobriety_tracking FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sobriety tracking" 
  ON public.sobriety_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sobriety tracking" 
  ON public.sobriety_tracking FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sobriety tracking" 
  ON public.sobriety_tracking FOR DELETE USING (auth.uid() = user_id);

-- Create sobriety_daily_checkins table
CREATE TABLE public.sobriety_daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sobriety_id UUID NOT NULL REFERENCES public.sobriety_tracking(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_number INTEGER NOT NULL,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  feeling TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sobriety_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.sobriety_daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own checkins" 
  ON public.sobriety_daily_checkins FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins" 
  ON public.sobriety_daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins" 
  ON public.sobriety_daily_checkins FOR UPDATE USING (auth.uid() = user_id);

-- Create award_sobriety_coins function
CREATE OR REPLACE FUNCTION public.award_sobriety_coins(
  _user_id UUID,
  _sobriety_id UUID,
  _day_number INTEGER,
  _feeling TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _coins_to_award INTEGER;
  _milestone_bonus INTEGER := 0;
BEGIN
  -- Progressive coin rewards based on streak
  _coins_to_award := CASE
    WHEN _day_number <= 7 THEN 10
    WHEN _day_number <= 14 THEN 15
    WHEN _day_number <= 30 THEN 25
    WHEN _day_number <= 60 THEN 40
    ELSE 60
  END;

  -- Milestone bonuses
  _milestone_bonus := CASE
    WHEN _day_number = 7 THEN 50
    WHEN _day_number = 14 THEN 100
    WHEN _day_number = 30 THEN 250
    WHEN _day_number = 60 THEN 500
    WHEN _day_number = 90 THEN 1000
    ELSE 0
  END;

  _coins_to_award := _coins_to_award + _milestone_bonus;

  -- Award the coins using existing add_tap_coins function
  PERFORM public.add_tap_coins(
    _user_id,
    _coins_to_award,
    'sobriety_streak',
    CASE 
      WHEN _milestone_bonus > 0 THEN 'Sobriety Day ' || _day_number || ' milestone reached!'
      ELSE 'Sobriety Day ' || _day_number || ' completed!'
    END
  );

  -- Record the checkin
  INSERT INTO public.sobriety_daily_checkins (user_id, sobriety_id, checkin_date, day_number, coins_awarded, feeling)
  VALUES (_user_id, _sobriety_id, CURRENT_DATE, _day_number, _coins_to_award, _feeling)
  ON CONFLICT (sobriety_id, checkin_date) DO NOTHING;

  RETURN _coins_to_award;
END;
$$;