-- Add language preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.language_preference IS 'User preferred language code (en, es, pt, fr, de, it)';