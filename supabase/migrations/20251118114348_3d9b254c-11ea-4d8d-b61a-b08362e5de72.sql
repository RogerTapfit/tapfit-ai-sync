-- Add workout_source tracking to workout_logs table
-- This tracks whether workouts came from custom, scheduled, or AI-generated sources
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS workout_source VARCHAR(20) DEFAULT 'custom'
CHECK (workout_source IN ('custom', 'scheduled', 'ai_generated'));

-- Add comment to explain the column
COMMENT ON COLUMN workout_logs.workout_source IS 'Tracks where the workout originated: custom (user-created), scheduled (from workout plan), or ai_generated (from AI scan)';

-- Create index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_workout_logs_source ON workout_logs(workout_source);

-- Create index for combined queries (user + source)
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_source ON workout_logs(user_id, workout_source);