-- Create food-photos storage bucket for storing food images
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', true);

-- Create policies for food photo uploads
CREATE POLICY "Users can view food photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-photos');

CREATE POLICY "Users can upload their own food photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'food-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own food photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'food-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own food photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'food-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add thumbnail_url column to food_entries if not exists
ALTER TABLE public.food_entries 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update existing entries to have proper photo fields structure
COMMENT ON COLUMN public.food_entries.photo_url IS 'Main photo URL from storage';
COMMENT ON COLUMN public.food_entries.photo_storage_path IS 'Storage path for the photo';
COMMENT ON COLUMN public.food_entries.thumbnail_url IS 'Thumbnail version URL for quick loading';