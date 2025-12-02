-- Create hydration_streaks table for tracking daily hydration streaks
CREATE TABLE IF NOT EXISTS public.hydration_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 1,
  longest_streak INTEGER NOT NULL DEFAULT 1,
  last_hydration_date DATE NOT NULL,
  total_hydration_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.hydration_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for hydration_streaks
CREATE POLICY "Users can view their own hydration streaks"
  ON public.hydration_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration streaks"
  ON public.hydration_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration streaks"
  ON public.hydration_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_hydration_streaks_user_id ON public.hydration_streaks(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_hydration_streaks_updated_at
  BEFORE UPDATE ON public.hydration_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();