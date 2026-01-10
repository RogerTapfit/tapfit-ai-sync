-- Create exercise_images table to store AI-generated workout form images
CREATE TABLE public.exercise_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id TEXT NOT NULL UNIQUE,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  mini_image_url TEXT,
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'complete', 'failed')),
  generation_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercise_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read exercise images (they're public content)
CREATE POLICY "Exercise images are publicly readable"
ON public.exercise_images
FOR SELECT
USING (true);

-- Only authenticated users with admin can modify (for now, allow all authenticated for testing)
CREATE POLICY "Authenticated users can insert exercise images"
ON public.exercise_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update exercise images"
ON public.exercise_images
FOR UPDATE
TO authenticated
USING (true);

-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-images',
  'exercise-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for exercise images bucket
CREATE POLICY "Exercise images are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise-images');

CREATE POLICY "Authenticated users can upload exercise images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-images');

CREATE POLICY "Authenticated users can update exercise images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'exercise-images');

-- Create trigger for updated_at
CREATE TRIGGER update_exercise_images_updated_at
BEFORE UPDATE ON public.exercise_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();