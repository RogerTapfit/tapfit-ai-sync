-- Create sleep_logs table for tracking user sleep data
CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sleep_date DATE NOT NULL,
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  awakenings INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, sleep_date)
);

-- Enable RLS
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sleep logs"
  ON public.sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sleep logs"
  ON public.sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep logs"
  ON public.sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep logs"
  ON public.sleep_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, sleep_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_sleep_logs_updated_at
  BEFORE UPDATE ON public.sleep_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add target_sleep_hours to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_sleep_hours NUMERIC DEFAULT 8;