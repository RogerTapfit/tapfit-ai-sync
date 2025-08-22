-- Fix Critical Security Vulnerability: Restrict profiles table access to owner-only
-- This addresses the exposure of sensitive personal health data to trainers and admins

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create secure, owner-only access policies for the main profiles table
CREATE POLICY "Users can view only their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update only their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create a secure function for trainers to access limited profile data
-- This function enforces security while allowing trainers to see basic info for users at their gym
CREATE OR REPLACE FUNCTION public.get_trainer_accessible_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  gym_id uuid,
  created_at timestamp with time zone,
  onboarding_completed boolean,
  calibration_completed boolean,
  experience_level text,
  preferred_equipment_type text,
  primary_goal text,
  avatar_id uuid,
  avatar_url text,
  avatar_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is trainer or admin
  IF has_role(auth.uid(), 'trainer'::app_role) THEN
    -- Trainers can only see users from their gym
    RETURN QUERY
    SELECT p.id, p.full_name, p.gym_id, p.created_at, p.onboarding_completed, 
           p.calibration_completed, p.experience_level, p.preferred_equipment_type, 
           p.primary_goal, p.avatar_id, p.avatar_url, p.avatar_data
    FROM public.profiles p
    WHERE p.gym_id = get_user_gym_id(auth.uid());
    
  ELSIF has_role(auth.uid(), 'admin'::app_role) THEN
    -- Admins can see all users' basic info
    RETURN QUERY
    SELECT p.id, p.full_name, p.gym_id, p.created_at, p.onboarding_completed, 
           p.calibration_completed, p.experience_level, p.preferred_equipment_type, 
           p.primary_goal, p.avatar_id, p.avatar_url, p.avatar_data
    FROM public.profiles p;
    
  ELSE
    -- Regular users get no access through this function
    RETURN;
  END IF;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_trainer_accessible_profiles() IS 'Secure function for trainers and admins to access non-sensitive profile data only. Sensitive health data (weight, height, age, health conditions, medical history, nutrition targets) is excluded for privacy protection.';