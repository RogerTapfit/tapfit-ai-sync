-- Fix security warnings: Function Search Path Mutable

-- Fix the search_path for existing functions that were flagged
CREATE OR REPLACE FUNCTION public.calculate_bmr(_weight_kg numeric, _height_cm numeric, _age integer, _gender text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.calculate_nutrition_goals(_weight_kg numeric, _height_cm numeric, _gender text, _activity_level text DEFAULT 'moderate'::text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.get_power_level_tier(_score integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE
    WHEN _score >= 800 THEN 'elite'
    WHEN _score >= 600 THEN 'strong'
    WHEN _score >= 400 THEN 'improving'
    WHEN _score >= 200 THEN 'inconsistent'
    ELSE 'inactive'
  END;
$$;