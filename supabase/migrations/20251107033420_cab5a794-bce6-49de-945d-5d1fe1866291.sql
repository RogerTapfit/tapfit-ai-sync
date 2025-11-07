-- Drop existing public sharing policies for workout_logs
DROP POLICY IF EXISTS "Users can view workout logs of public profiles with shared stat" ON workout_logs;

-- Drop existing public sharing policies for exercise_logs
DROP POLICY IF EXISTS "Users can view exercise logs of public profiles with shared sta" ON exercise_logs;

-- Create new follower-only policy for workout_logs
CREATE POLICY "Users can view workout logs of followed users with sharing enabled"
ON workout_logs FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_follows uf
    JOIN profiles p ON p.id = workout_logs.user_id
    WHERE uf.follower_id = auth.uid()
      AND uf.following_id = workout_logs.user_id
      AND uf.status = 'active'
      AND p.share_workout_stats = true
  )
);

-- Create new follower-only policy for exercise_logs
CREATE POLICY "Users can view exercise logs of followed users with sharing enabled"
ON exercise_logs FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM workout_logs wl
    JOIN user_follows uf ON uf.following_id = wl.user_id
    JOIN profiles p ON p.id = wl.user_id
    WHERE wl.id = exercise_logs.workout_log_id
      AND uf.follower_id = auth.uid()
      AND uf.status = 'active'
      AND p.share_workout_stats = true
  )
);