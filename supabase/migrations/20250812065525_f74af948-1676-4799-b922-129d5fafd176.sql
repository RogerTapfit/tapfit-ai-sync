-- Add missing health-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN health_conditions TEXT[],
ADD COLUMN previous_injuries TEXT[];