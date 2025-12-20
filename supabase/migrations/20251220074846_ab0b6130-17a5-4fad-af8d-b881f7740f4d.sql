-- Add weight_guidance and form_instructions columns to workout_exercises
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS weight_guidance TEXT,
ADD COLUMN IF NOT EXISTS form_instructions TEXT;