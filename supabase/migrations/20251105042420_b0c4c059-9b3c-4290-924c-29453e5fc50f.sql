-- Create personal records table
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  machine_name TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight_lbs INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  previous_record_weight INTEGER,
  improvement_percentage NUMERIC,
  celebrated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_machine_pr UNIQUE(user_id, machine_name)
);

-- Enable RLS
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own PRs"
  ON public.personal_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PRs"
  ON public.personal_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PRs"
  ON public.personal_records
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_personal_records_user_machine ON public.personal_records(user_id, machine_name);

-- Create PR history table to track all records over time
CREATE TABLE IF NOT EXISTS public.pr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  machine_name TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight_lbs INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current_pr BOOLEAN DEFAULT true,
  coins_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on PR history
ALTER TABLE public.pr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PR history"
  ON public.pr_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PR history"
  ON public.pr_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for PR history
CREATE INDEX idx_pr_history_user_machine ON public.pr_history(user_id, machine_name, achieved_at DESC);