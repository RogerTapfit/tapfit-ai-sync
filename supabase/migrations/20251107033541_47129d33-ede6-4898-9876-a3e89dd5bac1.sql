-- Add workout visibility mode to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS workout_visibility text 
CHECK (workout_visibility IN ('private', 'followers', 'public'))
DEFAULT 'followers';

-- Update existing profiles to use 'followers' visibility if they have sharing enabled
UPDATE profiles 
SET workout_visibility = 'followers' 
WHERE share_workout_stats = true AND workout_visibility IS NULL;

-- Update existing profiles to use 'private' visibility if they have sharing disabled
UPDATE profiles 
SET workout_visibility = 'private' 
WHERE share_workout_stats = false AND workout_visibility IS NULL;

-- Drop and recreate workout_logs policy with public visibility support
DROP POLICY IF EXISTS "Users can view workout logs of followed users with sharing enabled" ON workout_logs;

CREATE POLICY "Users can view workout logs based on visibility settings"
ON workout_logs FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = workout_logs.user_id
        AND p.share_workout_stats = true
        AND (
          -- Public mode: anyone can see
          p.workout_visibility = 'public'
          OR
          -- Followers mode: only followers can see
          (
            p.workout_visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM user_follows uf
              WHERE uf.follower_id = auth.uid()
                AND uf.following_id = workout_logs.user_id
                AND uf.status = 'active'
            )
          )
        )
    )
  )
);

-- Drop and recreate exercise_logs policy with public visibility support
DROP POLICY IF EXISTS "Users can view exercise logs of followed users with sharing enabled" ON exercise_logs;

CREATE POLICY "Users can view exercise logs based on visibility settings"
ON exercise_logs FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      JOIN profiles p ON p.id = wl.user_id
      WHERE wl.id = exercise_logs.workout_log_id
        AND p.share_workout_stats = true
        AND (
          -- Public mode: anyone can see
          p.workout_visibility = 'public'
          OR
          -- Followers mode: only followers can see
          (
            p.workout_visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM user_follows uf
              WHERE uf.follower_id = auth.uid()
                AND uf.following_id = wl.user_id
                AND uf.status = 'active'
            )
          )
        )
    )
  )
);