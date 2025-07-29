-- Add image_url column to machines table
ALTER TABLE public.machines 
ADD COLUMN image_url TEXT;

-- Create storage bucket for machine images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('machine-images', 'machine-images', true);

-- Create storage policies for machine images
CREATE POLICY "Machine images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'machine-images');

CREATE POLICY "Authenticated users can upload machine images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'machine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update machine images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'machine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete machine images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'machine-images' AND auth.role() = 'authenticated');