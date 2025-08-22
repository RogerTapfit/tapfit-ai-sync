-- Fix Critical Security Vulnerability: Restrict profiles table access to owner-only
-- This addresses the exposure of sensitive personal health data to trainers and admins

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create secure, owner-only access policies
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

-- Create a secure view for trainers/admins to access only non-sensitive profile data
-- This allows trainers to see basic info needed for fitness coaching without exposing sensitive health data
CREATE OR REPLACE VIEW public.profiles_trainer_view AS
SELECT 
  id,
  full_name,
  gym_id,
  created_at,
  onboarding_completed,
  calibration_completed,
  experience_level,
  preferred_equipment_type,
  primary_goal,
  avatar_id,
  avatar_url,
  avatar_data
FROM public.profiles;

-- Enable RLS on the trainer view
ALTER VIEW public.profiles_trainer_view SET (security_invoker = true);

-- Create RLS policy for trainer view - allows trainers to see basic info for users at their gym
CREATE POLICY "Trainers can view basic profile info for users at their gym" 
ON public.profiles_trainer_view
FOR SELECT 
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND get_user_gym_id(id) = get_user_gym_id(auth.uid())
);

-- Create RLS policy for admin view - allows admins to see basic info for all users
CREATE POLICY "Admins can view basic profile info for all users" 
ON public.profiles_trainer_view
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add helpful comment
COMMENT ON VIEW public.profiles_trainer_view IS 'Secure view for trainers and admins to access non-sensitive profile data only. Sensitive health data (weight, health conditions, medical history) is excluded for privacy protection.';