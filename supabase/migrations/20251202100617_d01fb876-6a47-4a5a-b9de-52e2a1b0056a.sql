-- Update calculate_user_power_level to include hydration score
CREATE OR REPLACE FUNCTION public.calculate_user_power_level(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  workout_score INTEGER := 0;
  nutrition_score INTEGER := 0;
  consistency_score INTEGER := 0;
  challenge_score INTEGER := 0;
  hydration_score INTEGER := 0;
  total_score INTEGER := 0;
  workout_count INTEGER;
  nutrition_days INTEGER;
  streak_days INTEGER;
  completed_challenges INTEGER;
  hydration_days INTEGER;
BEGIN
  -- Calculate workout score (0-400 points)
  SELECT COUNT(*)
  INTO workout_count
  FROM public.smart_pin_data
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  workout_score := LEAST(400, workout_count * 15);

  -- Calculate nutrition score (0-200 points)
  SELECT COUNT(DISTINCT logged_date)
  INTO nutrition_days
  FROM public.food_entries
  WHERE user_id = _user_id
    AND logged_date >= CURRENT_DATE - INTERVAL '30 days';
  
  nutrition_score := LEAST(200, nutrition_days * 7);

  -- Calculate consistency score (0-250 points)
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO streak_days
  FROM public.smart_pin_data
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '14 days';
  
  consistency_score := LEAST(250, streak_days * 18);

  -- Calculate challenge score (0-150 points)
  SELECT COUNT(*)
  INTO completed_challenges
  FROM public.user_challenges
  WHERE user_id = _user_id
    AND status = 'completed'
    AND completed_at >= CURRENT_DATE - INTERVAL '30 days';
  
  challenge_score := LEAST(150, completed_challenges * 25);

  -- Calculate hydration score (0-100 points)
  SELECT COUNT(DISTINCT logged_date)
  INTO hydration_days
  FROM public.water_intake
  WHERE user_id = _user_id
    AND logged_date >= CURRENT_DATE - INTERVAL '30 days';
  
  hydration_score := LEAST(100, hydration_days * 4);

  -- Calculate total score (max 1000)
  total_score := workout_score + nutrition_score + consistency_score + challenge_score + hydration_score;
  
  RETURN LEAST(1000, total_score);
END;
$function$;

-- Update update_user_power_level to include hydration_days in factors
CREATE OR REPLACE FUNCTION public.update_user_power_level(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  new_score INTEGER;
  new_tier TEXT;
  score_factors JSONB;
BEGIN
  -- Calculate new score
  new_score := public.calculate_user_power_level(_user_id);
  new_tier := public.get_power_level_tier(new_score);
  
  -- Create factors breakdown for history
  score_factors := jsonb_build_object(
    'workout_days', (
      SELECT COUNT(DISTINCT DATE(created_at))
      FROM public.smart_pin_data
      WHERE user_id = _user_id AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'nutrition_days', (
      SELECT COUNT(DISTINCT logged_date)
      FROM public.food_entries
      WHERE user_id = _user_id AND logged_date >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'completed_challenges', (
      SELECT COUNT(*)
      FROM public.user_challenges
      WHERE user_id = _user_id AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'hydration_days', (
      SELECT COUNT(DISTINCT logged_date)
      FROM public.water_intake
      WHERE user_id = _user_id AND logged_date >= CURRENT_DATE - INTERVAL '30 days'
    )
  );

  -- Update or insert power level
  INSERT INTO public.user_power_levels (user_id, current_score, current_tier, last_calculated_at)
  VALUES (_user_id, new_score, new_tier, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    current_score = EXCLUDED.current_score,
    current_tier = EXCLUDED.current_tier,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();

  -- Insert into history
  INSERT INTO public.power_level_history (user_id, score, tier, factors)
  VALUES (_user_id, new_score, new_tier, score_factors);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

-- Create trigger function for water intake
CREATE OR REPLACE FUNCTION public.trigger_power_level_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.update_user_power_level(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add trigger on water_intake table
DROP TRIGGER IF EXISTS update_power_level_after_hydration ON public.water_intake;
CREATE TRIGGER update_power_level_after_hydration
  AFTER INSERT OR UPDATE ON public.water_intake
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_power_level_update();