-- Create user_workout_summary view with RLS-compliant aggregations
CREATE OR REPLACE VIEW public.user_workout_summary AS
SELECT 
  user_id,
  muscle_group,
  SUM(reps) as total_reps,
  SUM(sets) as total_sets,
  SUM(reps * sets * weight) as total_volume,
  ROUND(AVG(weight)::numeric, 2) as average_weight,
  COUNT(*) as total_exercises,
  MIN(timestamp) as first_workout,
  MAX(timestamp) as last_workout
FROM public.smart_pin_data
WHERE user_id = auth.uid()
GROUP BY user_id, muscle_group;

-- Enable RLS on the view
ALTER VIEW public.user_workout_summary SET (security_invoker = true);

-- Create a separate view for most common muscle group per user
CREATE OR REPLACE VIEW public.user_most_common_muscle_group AS
SELECT 
  user_id,
  muscle_group as most_common_muscle_group,
  exercise_count
FROM (
  SELECT 
    user_id,
    muscle_group,
    COUNT(*) as exercise_count,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY COUNT(*) DESC) as rn
  FROM public.smart_pin_data
  WHERE user_id = auth.uid()
  GROUP BY user_id, muscle_group
) ranked
WHERE rn = 1;

-- Enable RLS on the most common muscle group view
ALTER VIEW public.user_most_common_muscle_group SET (security_invoker = true);