-- Restore user's walk from December 28, 2025
INSERT INTO public.run_sessions (
  id,
  user_id,
  started_at,
  ended_at,
  status,
  total_distance_m,
  moving_time_s,
  elapsed_time_s,
  avg_pace_sec_per_km,
  calories,
  unit,
  source,
  activity_type,
  elevation_gain_m,
  elevation_loss_m
) VALUES (
  gen_random_uuid(),
  '80603dc0-1dca-43fa-a753-a835dc074209',
  '2025-12-28T16:00:00Z',
  '2025-12-28T16:13:46Z',
  'completed',
  2090,
  826,
  826,
  395,
  146,
  'km',
  'gps',
  'walk',
  0,
  0
);