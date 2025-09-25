-- Add gender field to profiles table for cycle tracking eligibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT 
CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));