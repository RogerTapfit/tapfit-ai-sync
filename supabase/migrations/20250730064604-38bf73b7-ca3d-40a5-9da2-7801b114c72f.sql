-- Update the handle_new_user function to extract a proper name from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  extracted_name text;
BEGIN
  -- Try to extract a reasonable name from email if no full_name provided
  IF NEW.raw_user_meta_data->>'full_name' IS NULL OR NEW.raw_user_meta_data->>'full_name' = '' THEN
    -- Extract the part before @ and replace dots/underscores with spaces
    -- Then capitalize first letter of each word
    extracted_name := INITCAP(REPLACE(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' '), '_', ' '));
  ELSE
    extracted_name := NEW.raw_user_meta_data->>'full_name';
  END IF;

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
    extracted_name,
    false,
    false,
    100 -- Starting coins
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles that have email addresses as full_name
UPDATE public.profiles 
SET full_name = INITCAP(REPLACE(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '), '_', ' '))
WHERE full_name = email AND email IS NOT NULL;