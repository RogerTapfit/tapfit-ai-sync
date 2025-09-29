-- Clean up duplicate incomplete workout logs from September 29th
DELETE FROM public.workout_logs 
WHERE DATE(started_at) = '2025-09-29'
  AND completed_at IS NULL 
  AND completed_exercises = 0 
  AND total_reps = 0;