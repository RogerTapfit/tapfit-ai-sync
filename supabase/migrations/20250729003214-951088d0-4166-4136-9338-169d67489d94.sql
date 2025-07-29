-- Add missing columns to user_fitness_preferences table
ALTER TABLE user_fitness_preferences 
ADD COLUMN IF NOT EXISTS available_equipment TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_restrictions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_muscle_groups TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_workout_time TEXT DEFAULT 'evening';