-- Create character-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-images',
  'character-images', 
  true,
  26214400, -- 25MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policies for character images bucket access
CREATE POLICY "Anyone can view character images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'character-images');

CREATE POLICY "Authenticated users can upload character images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'character-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own character images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'character-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own character images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'character-images' 
  AND auth.uid() IS NOT NULL
);