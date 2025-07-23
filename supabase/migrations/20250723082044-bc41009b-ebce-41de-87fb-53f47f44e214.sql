-- Add biometric and onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN weight_kg NUMERIC,
ADD COLUMN height_cm NUMERIC,
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN diet_type TEXT CHECK (diet_type IN ('vegan', 'omnivore', 'special_diet')) DEFAULT 'omnivore',
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN calibration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN target_daily_calories INTEGER,
ADD COLUMN target_protein_grams INTEGER,
ADD COLUMN target_carbs_grams INTEGER,
ADD COLUMN target_fat_grams INTEGER;

-- Create function to calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
CREATE OR REPLACE FUNCTION public.calculate_bmr(_weight_kg NUMERIC, _height_cm NUMERIC, _age INTEGER, _gender TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF _gender = 'male' THEN
    RETURN ROUND((10 * _weight_kg) + (6.25 * _height_cm) - (5 * _age) + 5);
  ELSE
    -- Default to female calculation for female/other/null
    RETURN ROUND((10 * _weight_kg) + (6.25 * _height_cm) - (5 * _age) - 161);
  END IF;
END;
$$;

-- Create function to calculate personalized nutrition goals
CREATE OR REPLACE FUNCTION public.calculate_nutrition_goals(_weight_kg NUMERIC, _height_cm NUMERIC, _gender TEXT, _activity_level TEXT DEFAULT 'moderate')
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  estimated_age INTEGER := 30; -- Default age for calculation
  bmr INTEGER;
  tdee INTEGER;
  activity_multiplier NUMERIC;
  protein_grams INTEGER;
  fat_grams INTEGER;
  carbs_grams INTEGER;
BEGIN
  -- Set activity multiplier
  activity_multiplier := CASE _activity_level
    WHEN 'sedentary' THEN 1.2
    WHEN 'light' THEN 1.375
    WHEN 'moderate' THEN 1.55
    WHEN 'active' THEN 1.725
    WHEN 'very_active' THEN 1.9
    ELSE 1.55
  END;
  
  -- Calculate BMR and TDEE
  bmr := public.calculate_bmr(_weight_kg, _height_cm, estimated_age, _gender);
  tdee := ROUND(bmr * activity_multiplier);
  
  -- Calculate macros (30% protein, 25% fat, 45% carbs)
  protein_grams := ROUND((_weight_kg * 2.2) * 1.2); -- 1.2g per lb bodyweight
  fat_grams := ROUND((tdee * 0.25) / 9); -- 25% of calories from fat
  carbs_grams := ROUND((tdee - (protein_grams * 4) - (fat_grams * 9)) / 4); -- Remaining calories from carbs
  
  RETURN jsonb_build_object(
    'daily_calories', tdee,
    'protein_grams', protein_grams,
    'carbs_grams', carbs_grams,
    'fat_grams', fat_grams,
    'bmr', bmr
  );
END;
$$;

-- Create function to set initial power level and goals after onboarding
CREATE OR REPLACE FUNCTION public.complete_user_calibration(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_profile RECORD;
  nutrition_goals JSONB;
  initial_power_level INTEGER := 200; -- Starting power level for new users
BEGIN
  -- Get user profile data
  SELECT weight_kg, height_cm, gender, diet_type
  INTO user_profile
  FROM public.profiles
  WHERE id = _user_id;
  
  -- Calculate personalized nutrition goals
  nutrition_goals := public.calculate_nutrition_goals(
    user_profile.weight_kg, 
    user_profile.height_cm, 
    user_profile.gender,
    'moderate'
  );
  
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
    CASE user_profile.diet_type 
      WHEN 'vegan' THEN 'plant_based'
      WHEN 'omnivore' THEN 'balanced'
      ELSE 'custom'
    END,
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
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;