-- Allow viewing workout logs for public profiles with shared stats
CREATE POLICY "Users can view workout logs of public profiles with shared stats"
ON workout_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = workout_logs.user_id
    AND profiles.is_profile_public = true
    AND profiles.share_workout_stats = true
  )
);

-- Allow viewing exercise logs for public profiles with shared stats
CREATE POLICY "Users can view exercise logs of public profiles with shared stats"
ON exercise_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    JOIN profiles p ON p.id = wl.user_id
    WHERE wl.id = exercise_logs.workout_log_id
    AND p.is_profile_public = true
    AND p.share_workout_stats = true
  )
);