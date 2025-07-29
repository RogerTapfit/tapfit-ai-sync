-- Fix the primary_goal constraint to include all valid values
ALTER TABLE public.user_fitness_preferences 
DROP CONSTRAINT IF EXISTS user_fitness_preferences_primary_goal_check;

ALTER TABLE public.user_fitness_preferences 
ADD CONSTRAINT user_fitness_preferences_primary_goal_check 
CHECK (primary_goal IN ('weight_loss', 'muscle_building', 'general_fitness', 'strength_training', 'endurance', 'athletic_performance'));

-- Fix the current_fitness_level constraint to include all valid values
ALTER TABLE public.user_fitness_preferences 
DROP CONSTRAINT IF EXISTS user_fitness_preferences_current_fitness_level_check;

ALTER TABLE public.user_fitness_preferences 
ADD CONSTRAINT user_fitness_preferences_current_fitness_level_check 
CHECK (current_fitness_level IN ('beginner', 'intermediate', 'advanced'));

-- Fix the preferred_workout_time constraint to include all valid values
ALTER TABLE public.user_fitness_preferences 
DROP CONSTRAINT IF EXISTS user_fitness_preferences_preferred_workout_time_check;

ALTER TABLE public.user_fitness_preferences 
ADD CONSTRAINT user_fitness_preferences_preferred_workout_time_check 
CHECK (preferred_workout_time IN ('morning', 'afternoon', 'evening', 'night'));