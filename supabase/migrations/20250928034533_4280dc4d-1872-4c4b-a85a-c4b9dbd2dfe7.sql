-- Create machine recognition feedback table for user corrections
CREATE TABLE IF NOT EXISTS public.machine_recognition_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  detected_machine_id TEXT NOT NULL,
  corrected_machine_id TEXT NOT NULL,
  ai_confidence DECIMAL(3,2) NOT NULL,
  image_thumbnail TEXT, -- Base64 thumbnail for analysis
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.machine_recognition_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feedback" 
ON public.machine_recognition_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" 
ON public.machine_recognition_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for queries
CREATE INDEX idx_machine_feedback_corrections ON public.machine_recognition_feedback(detected_machine_id, corrected_machine_id);
CREATE INDEX idx_machine_feedback_user_date ON public.machine_recognition_feedback(user_id, created_at);

-- Add some sample data to help improve future recognition
COMMENT ON TABLE public.machine_recognition_feedback IS 'Stores user corrections for machine recognition to improve AI accuracy over time';