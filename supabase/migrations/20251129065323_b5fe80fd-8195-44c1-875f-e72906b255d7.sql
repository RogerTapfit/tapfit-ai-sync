-- Create water intake tracking table
CREATE TABLE public.water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own water intake"
ON public.water_intake FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water intake"
ON public.water_intake FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake"
ON public.water_intake FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake"
ON public.water_intake FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast daily queries
CREATE INDEX idx_water_intake_user_date ON public.water_intake(user_id, logged_date);