-- Create workout streaks table
CREATE TABLE IF NOT EXISTS public.workout_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  streak_start_date DATE,
  total_workout_days INTEGER NOT NULL DEFAULT 0,
  milestones_achieved JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_streak UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.workout_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own streak"
  ON public.workout_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streak"
  ON public.workout_streaks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
  ON public.workout_streaks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create streak milestones table
CREATE TABLE IF NOT EXISTS public.streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_days INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on milestones
ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.streak_milestones
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own milestones"
  ON public.streak_milestones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_workout_streaks_user ON public.workout_streaks(user_id);
CREATE INDEX idx_streak_milestones_user ON public.streak_milestones(user_id, achieved_at DESC);

-- Create function to update streak
CREATE OR REPLACE FUNCTION public.update_workout_streak(_user_id UUID, _workout_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_streak_record RECORD;
  new_streak INTEGER;
  is_consecutive BOOLEAN;
  milestone_reached INTEGER := 0;
  coins_to_award INTEGER := 0;
  result JSONB;
BEGIN
  -- Get current streak data
  SELECT * INTO current_streak_record
  FROM public.workout_streaks
  WHERE user_id = _user_id;
  
  -- Initialize if no record exists
  IF current_streak_record IS NULL THEN
    INSERT INTO public.workout_streaks (
      user_id, 
      current_streak, 
      longest_streak, 
      last_workout_date,
      streak_start_date,
      total_workout_days
    )
    VALUES (_user_id, 1, 1, _workout_date, _workout_date, 1);
    
    RETURN jsonb_build_object(
      'current_streak', 1,
      'milestone_reached', 0,
      'coins_awarded', 0
    );
  END IF;
  
  -- Check if workout is on the same day (don't count twice)
  IF current_streak_record.last_workout_date = _workout_date THEN
    RETURN jsonb_build_object(
      'current_streak', current_streak_record.current_streak,
      'milestone_reached', 0,
      'coins_awarded', 0
    );
  END IF;
  
  -- Check if consecutive (yesterday or today)
  is_consecutive := (
    _workout_date = current_streak_record.last_workout_date + 1 OR
    _workout_date = current_streak_record.last_workout_date
  );
  
  -- Calculate new streak
  IF is_consecutive THEN
    new_streak := current_streak_record.current_streak + 1;
  ELSE
    -- Streak broken, start new one
    new_streak := 1;
  END IF;
  
  -- Check for milestone achievements (7, 14, 30 days)
  IF is_consecutive THEN
    IF new_streak = 7 AND NOT (current_streak_record.milestones_achieved ? '7') THEN
      milestone_reached := 7;
      coins_to_award := 100;
    ELSIF new_streak = 14 AND NOT (current_streak_record.milestones_achieved ? '14') THEN
      milestone_reached := 14;
      coins_to_award := 250;
    ELSIF new_streak = 30 AND NOT (current_streak_record.milestones_achieved ? '30') THEN
      milestone_reached := 30;
      coins_to_award := 500;
    ELSIF new_streak = 60 AND NOT (current_streak_record.milestones_achieved ? '60') THEN
      milestone_reached := 60;
      coins_to_award := 1000;
    ELSIF new_streak = 100 AND NOT (current_streak_record.milestones_achieved ? '100') THEN
      milestone_reached := 100;
      coins_to_award := 2000;
    END IF;
  END IF;
  
  -- Award coins for milestone
  IF coins_to_award > 0 THEN
    PERFORM public.add_tap_coins(
      _user_id,
      coins_to_award,
      'streak_milestone',
      'Streak milestone: ' || milestone_reached || ' days'
    );
    
    -- Record milestone achievement
    INSERT INTO public.streak_milestones (
      user_id,
      milestone_days,
      coins_awarded,
      streak_count
    ) VALUES (
      _user_id,
      milestone_reached,
      coins_to_award,
      new_streak
    );
  END IF;
  
  -- Update streak record
  UPDATE public.workout_streaks
  SET 
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    last_workout_date = _workout_date,
    streak_start_date = CASE 
      WHEN is_consecutive THEN streak_start_date 
      ELSE _workout_date 
    END,
    total_workout_days = total_workout_days + 1,
    milestones_achieved = CASE
      WHEN milestone_reached > 0 THEN 
        milestones_achieved || jsonb_build_object(milestone_reached::text, true)
      ELSE milestones_achieved
    END,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN jsonb_build_object(
    'current_streak', new_streak,
    'milestone_reached', milestone_reached,
    'coins_awarded', coins_to_award,
    'is_new_streak', NOT is_consecutive
  );
END;
$$;