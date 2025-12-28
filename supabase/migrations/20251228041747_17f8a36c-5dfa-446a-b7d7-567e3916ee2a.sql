-- Create storage bucket for machine scan photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('machine-scan-photos', 'machine-scan-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for machine scan photos
CREATE POLICY "Users can upload their scan photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'machine-scan-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view scan photos for ML"
ON storage.objects FOR SELECT
USING (bucket_id = 'machine-scan-photos');

CREATE POLICY "Users can delete their own scan photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'machine-scan-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create training data table
CREATE TABLE public.machine_scan_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Photo data
  photo_url TEXT NOT NULL,
  photo_storage_path TEXT,
  
  -- AI detection results
  ai_detected_machine_id TEXT NOT NULL,
  ai_confidence DECIMAL(4,3) NOT NULL,
  ai_reasoning TEXT,
  ai_alternatives JSONB,
  
  -- User confirmation/correction
  user_selected_machine_id TEXT NOT NULL,
  was_ai_correct BOOLEAN GENERATED ALWAYS AS (ai_detected_machine_id = user_selected_machine_id) STORED,
  
  -- Context for learning
  gym_name TEXT,
  device_type TEXT,
  capture_method TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.machine_scan_training ENABLE ROW LEVEL SECURITY;

-- Users can insert their own training data
CREATE POLICY "Users can insert own training data"
ON public.machine_scan_training
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Training data is readable for ML (public read)
CREATE POLICY "Training data readable for ML"
ON public.machine_scan_training
FOR SELECT
USING (true);

-- Indexes for ML queries
CREATE INDEX idx_training_machine ON public.machine_scan_training(user_selected_machine_id);
CREATE INDEX idx_training_accuracy ON public.machine_scan_training(was_ai_correct, ai_detected_machine_id);
CREATE INDEX idx_training_confidence ON public.machine_scan_training(ai_confidence);
CREATE INDEX idx_training_user ON public.machine_scan_training(user_id);
CREATE INDEX idx_training_created ON public.machine_scan_training(created_at DESC);