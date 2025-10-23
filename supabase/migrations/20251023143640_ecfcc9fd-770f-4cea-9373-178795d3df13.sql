-- Add heart rate training columns to run_sessions table
ALTER TABLE public.run_sessions
ADD COLUMN IF NOT EXISTS training_mode TEXT,
ADD COLUMN IF NOT EXISTS target_hr_zone JSONB,
ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS time_in_zone_s INTEGER,
ADD COLUMN IF NOT EXISTS hr_samples JSONB;

COMMENT ON COLUMN public.run_sessions.training_mode IS 'Training mode: pace_based, steady_jog, steady_run, intervals, hr_zone_custom';
COMMENT ON COLUMN public.run_sessions.target_hr_zone IS 'Target heart rate zone with min_bpm, max_bpm, zone_name';
COMMENT ON COLUMN public.run_sessions.avg_heart_rate IS 'Average heart rate in BPM during the run';
COMMENT ON COLUMN public.run_sessions.max_heart_rate IS 'Maximum heart rate in BPM during the run';
COMMENT ON COLUMN public.run_sessions.time_in_zone_s IS 'Time spent in target heart rate zone in seconds';
COMMENT ON COLUMN public.run_sessions.hr_samples IS 'Array of heart rate samples with timestamp: [{ bpm, timestamp }]';
