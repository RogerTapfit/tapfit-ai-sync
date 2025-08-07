-- Fix diet type constraint to include all onboarding options
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_diet_type_check;

-- Add new constraint with all diet types from onboarding
ALTER TABLE public.profiles ADD CONSTRAINT profiles_diet_type_check 
CHECK (diet_type = ANY(ARRAY['vegan'::text, 'omnivore'::text, 'special_diet'::text, 'vegetarian'::text, 'keto'::text, 'high_protein'::text]));

-- Update the complete_user_calibration function to handle all diet types
CREATE OR REPLACE FUNCTION public.complete_user_calibration(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_profile RECORD;
  nutrition_goals JSONB;
  initial_power_level INTEGER := 200;
  goal_type_mapping TEXT;
BEGIN
  -- Get user profile data
  SELECT weight_kg, height_cm, gender, diet_type, age
  INTO user_profile
  FROM public.profiles
  WHERE id = _user_id;
  
  -- Return false if essential data is missing
  IF user_profile.weight_kg IS NULL OR user_profile.height_cm IS NULL THEN
    RAISE NOTICE 'Missing essential data for user %: weight_kg=%, height_cm=%', _user_id, user_profile.weight_kg, user_profile.height_cm;
    RETURN FALSE;
  END IF;
  
  -- Calculate personalized nutrition goals
  nutrition_goals := public.calculate_nutrition_goals(
    user_profile.weight_kg, 
    user_profile.height_cm, 
    user_profile.gender,
    'moderate'
  );
  
  -- Map diet types to goal types
  goal_type_mapping := CASE user_profile.diet_type
    WHEN 'vegan' THEN 'plant_based'
    WHEN 'vegetarian' THEN 'plant_based'
    WHEN 'omnivore' THEN 'balanced'
    WHEN 'keto' THEN 'low_carb'
    WHEN 'high_protein' THEN 'high_protein'
    ELSE 'custom'
  END;
  
  -- Update profile with nutrition goals and mark calibration complete
  UPDATE public.profiles
  SET 
    target_daily_calories = (nutrition_goals->>'daily_calories')::INTEGER,
    target_protein_grams = (nutrition_goals->>'protein_grams')::INTEGER,
    target_carbs_grams = (nutrition_goals->>'carbs_grams')::INTEGER,
    target_fat_grams = (nutrition_goals->>'fat_grams')::INTEGER,
    calibration_completed = TRUE
  WHERE id = _user_id;
  
  -- Set initial power level
  INSERT INTO public.user_power_levels (user_id, current_score, current_tier)
  VALUES (_user_id, initial_power_level, 'inconsistent')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create initial nutrition goal
  INSERT INTO public.nutrition_goals (
    user_id, 
    goal_type, 
    daily_calories, 
    protein_grams, 
    carbs_grams, 
    fat_grams,
    is_active
  )
  VALUES (
    _user_id,
    goal_type_mapping,
    (nutrition_goals->>'daily_calories')::INTEGER,
    (nutrition_goals->>'protein_grams')::INTEGER,
    (nutrition_goals->>'carbs_grams')::INTEGER,
    (nutrition_goals->>'fat_grams')::INTEGER,
    TRUE
  )
  ON CONFLICT (user_id, goal_type) DO UPDATE SET
    daily_calories = EXCLUDED.daily_calories,
    protein_grams = EXCLUDED.protein_grams,
    carbs_grams = EXCLUDED.carbs_grams,
    fat_grams = EXCLUDED.fat_grams,
    is_active = TRUE,
    updated_at = now();
    
  RAISE NOTICE 'Successfully calibrated user %', _user_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error calibrating user %: %', _user_id, SQLERRM;
    RETURN FALSE;
END;
$function$;

-- Retroactively calibrate existing users who have profile data but aren't calibrated
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id 
    FROM public.profiles 
    WHERE onboarding_completed = true 
      AND calibration_completed = false
      AND weight_kg IS NOT NULL
      AND height_cm IS NOT NULL
  LOOP
    PERFORM public.complete_user_calibration(user_record.id);
  END LOOP;
END $$;