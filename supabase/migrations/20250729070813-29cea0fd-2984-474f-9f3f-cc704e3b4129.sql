-- Fix profile creation and calibration issues

-- 1. Update the handle_new_user function to ensure proper profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    onboarding_completed,
    calibration_completed,
    tap_coins_balance
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false,
    false,
    100 -- Starting coins
  );
  RETURN NEW;
END;
$$;

-- 2. Create a function to fix existing incomplete profiles
CREATE OR REPLACE FUNCTION public.fix_incomplete_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Fix profiles that exist but are missing data
  FOR user_record IN 
    SELECT id, email FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name,
      onboarding_completed,
      calibration_completed,
      tap_coins_balance
    )
    VALUES (
      user_record.id,
      user_record.email,
      user_record.email,
      false,
      false,
      100
    );
  END LOOP;
  
  -- Complete calibration for users who have physical data but haven't been calibrated
  UPDATE public.profiles 
  SET calibration_completed = true,
      target_daily_calories = CASE 
        WHEN weight_kg IS NOT NULL AND height_cm IS NOT NULL THEN
          (SELECT (nutrition_goals->>'daily_calories')::INTEGER 
           FROM public.calculate_nutrition_goals(weight_kg, height_cm, gender, 'moderate'))
        ELSE 2000
      END,
      target_protein_grams = CASE 
        WHEN weight_kg IS NOT NULL AND height_cm IS NOT NULL THEN
          (SELECT (nutrition_goals->>'protein_grams')::INTEGER 
           FROM public.calculate_nutrition_goals(weight_kg, height_cm, gender, 'moderate'))
        ELSE 150
      END,
      target_carbs_grams = CASE 
        WHEN weight_kg IS NOT NULL AND height_cm IS NOT NULL THEN
          (SELECT (nutrition_goals->>'carbs_grams')::INTEGER 
           FROM public.calculate_nutrition_goals(weight_kg, height_cm, gender, 'moderate'))
        ELSE 200
      END,
      target_fat_grams = CASE 
        WHEN weight_kg IS NOT NULL AND height_cm IS NOT NULL THEN
          (SELECT (nutrition_goals->>'fat_grams')::INTEGER 
           FROM public.calculate_nutrition_goals(weight_kg, height_cm, gender, 'moderate'))
        ELSE 67
      END
  WHERE onboarding_completed = true 
    AND calibration_completed = false
    AND weight_kg IS NOT NULL;

END;
$$;

-- 3. Run the fix function
SELECT public.fix_incomplete_profiles();

-- 4. Create a function to ensure data persistence and sync
CREATE OR REPLACE FUNCTION public.refresh_daily_nutrition_summary_for_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Refresh today's nutrition summary
  DELETE FROM public.daily_nutrition_summary 
  WHERE user_id = _user_id AND summary_date = CURRENT_DATE;
  
  INSERT INTO public.daily_nutrition_summary (
    user_id, 
    summary_date, 
    total_calories, 
    total_protein, 
    total_carbs, 
    total_fat, 
    meals_count
  )
  SELECT 
    user_id,
    logged_date,
    COALESCE(SUM(total_calories), 0),
    COALESCE(SUM(total_protein), 0),
    COALESCE(SUM(total_carbs), 0),
    COALESCE(SUM(total_fat), 0),
    COUNT(*)
  FROM public.food_entries
  WHERE user_id = _user_id
    AND logged_date = CURRENT_DATE
  GROUP BY user_id, logged_date;
END;
$$;

-- 5. Create trigger to auto-refresh nutrition summaries on food entry changes
CREATE OR REPLACE FUNCTION public.trigger_nutrition_summary_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Refresh nutrition summary for the affected user
  PERFORM public.refresh_daily_nutrition_summary_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS refresh_nutrition_summary_trigger ON public.food_entries;

-- Create new trigger for food entries
CREATE TRIGGER refresh_nutrition_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.food_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_nutrition_summary_refresh();