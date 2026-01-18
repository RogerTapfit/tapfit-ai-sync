-- Add reminder columns to user_habits table
ALTER TABLE public.user_habits
ADD COLUMN reminder_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN reminder_times JSONB DEFAULT '[]'::jsonb,
ADD COLUMN reminder_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb;