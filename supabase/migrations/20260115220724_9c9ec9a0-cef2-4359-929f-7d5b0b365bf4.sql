-- Create table for crowdsourced weight stack data
CREATE TABLE public.machine_weight_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name TEXT NOT NULL,
  gym_id UUID REFERENCES public.gyms(id),
  
  -- The actual weight values from the stack photo (in lbs)
  weight_stack JSONB NOT NULL DEFAULT '[]'::jsonb, -- [15, 30, 45, 65, 85, 105, 125, 145, ...]
  
  -- Photo evidence
  photo_url TEXT NOT NULL,
  photo_storage_path TEXT,
  
  -- Contribution metadata
  contributed_by UUID REFERENCES auth.users(id),
  verification_count INTEGER DEFAULT 1,
  verified_by JSONB DEFAULT '[]'::jsonb, -- Array of user IDs who confirmed
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint per machine per gym (null gym = generic)
  UNIQUE(machine_name, gym_id)
);

-- Create index for quick lookups
CREATE INDEX idx_machine_weight_stacks_machine ON public.machine_weight_stacks(machine_name);
CREATE INDEX idx_machine_weight_stacks_gym ON public.machine_weight_stacks(gym_id);

-- Enable RLS
ALTER TABLE public.machine_weight_stacks ENABLE ROW LEVEL SECURITY;

-- Everyone can read weight stacks (crowdsourced benefit)
CREATE POLICY "Anyone can view weight stacks"
ON public.machine_weight_stacks
FOR SELECT
USING (true);

-- Authenticated users can contribute new weight stacks
CREATE POLICY "Authenticated users can insert weight stacks"
ON public.machine_weight_stacks
FOR INSERT
WITH CHECK (auth.uid() = contributed_by);

-- Users can update weight stacks they contributed
CREATE POLICY "Contributors can update their weight stacks"
ON public.machine_weight_stacks
FOR UPDATE
USING (auth.uid() = contributed_by);

-- Create storage bucket for weight stack photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('weight-stack-photos', 'weight-stack-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for weight stack photos
CREATE POLICY "Anyone can view weight stack photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'weight-stack-photos');

CREATE POLICY "Authenticated users can upload weight stack photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'weight-stack-photos' AND auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_machine_weight_stacks_updated_at
BEFORE UPDATE ON public.machine_weight_stacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();