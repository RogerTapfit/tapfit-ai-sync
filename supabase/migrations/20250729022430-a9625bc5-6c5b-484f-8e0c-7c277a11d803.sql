-- Update workout_exercises table to support both strength and cardio exercises
-- Make sets and reps nullable since cardio exercises don't use them
ALTER TABLE public.workout_exercises 
ALTER COLUMN sets DROP NOT NULL,
ALTER COLUMN reps DROP NOT NULL;

-- Add new columns for cardio exercises
ALTER TABLE public.workout_exercises 
ADD COLUMN duration_minutes integer,
ADD COLUMN exercise_type text,
ADD COLUMN intensity text;

-- Add a check constraint to ensure either strength or cardio fields are populated
ALTER TABLE public.workout_exercises 
ADD CONSTRAINT workout_exercises_type_check 
CHECK (
  (sets IS NOT NULL AND reps IS NOT NULL AND duration_minutes IS NULL) OR
  (duration_minutes IS NOT NULL AND sets IS NULL AND reps IS NULL)
);