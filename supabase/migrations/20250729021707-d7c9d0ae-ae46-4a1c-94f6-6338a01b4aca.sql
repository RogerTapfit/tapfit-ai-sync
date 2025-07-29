-- Fix the workout_plans fitness_goal constraint to match user_fitness_preferences values
ALTER TABLE public.workout_plans 
DROP CONSTRAINT IF EXISTS workout_plans_fitness_goal_check;

ALTER TABLE public.workout_plans 
ADD CONSTRAINT workout_plans_fitness_goal_check 
CHECK (fitness_goal IN ('muscle_building', 'fat_loss', 'toning', 'endurance', 'general_fitness', 'strength_training', 'athletic_performance'));