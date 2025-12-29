-- Add activity_type column to distinguish runs vs walks
ALTER TABLE public.run_sessions 
ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'run';

-- Add comment for clarity
COMMENT ON COLUMN public.run_sessions.activity_type IS 'Type of activity: run or walk';