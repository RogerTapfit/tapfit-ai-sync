-- Add support for multiple food photos per entry and improve photo storage

-- Add multiple photos support to food_entries
ALTER TABLE public.food_entries 
ADD COLUMN photo_urls text[], -- Array of photo URLs
ADD COLUMN photo_storage_paths text[], -- Array of storage paths for management
ADD COLUMN thumbnail_urls text[]; -- Array of thumbnail URLs

-- Create index for faster photo queries
CREATE INDEX idx_food_entries_photos ON public.food_entries USING GIN (photo_urls) WHERE photo_urls IS NOT NULL;
CREATE INDEX idx_food_entries_storage_paths ON public.food_entries USING GIN (photo_storage_paths) WHERE photo_storage_paths IS NOT NULL;

-- Create food_photos table for detailed photo metadata
CREATE TABLE IF NOT EXISTS public.food_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_entry_id uuid REFERENCES public.food_entries(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  photo_url text NOT NULL,
  thumbnail_url text,
  file_size integer,
  upload_timestamp timestamp with time zone DEFAULT now(),
  photo_type text DEFAULT 'main_dish', -- main_dish, nutrition_label, ingredients, angle_view
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for food_photos
ALTER TABLE public.food_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for food_photos
CREATE POLICY "Users can create their own food photos"
  ON public.food_photos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own food photos"
  ON public.food_photos FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own food photos"
  ON public.food_photos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food photos"
  ON public.food_photos FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_food_photos_user_id ON public.food_photos(user_id);
CREATE INDEX idx_food_photos_entry_id ON public.food_photos(food_entry_id);
CREATE INDEX idx_food_photos_timestamp ON public.food_photos(upload_timestamp DESC);

-- Create function to clean up base64 data URLs in existing entries
CREATE OR REPLACE FUNCTION public.clean_base64_photo_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update entries that have base64 data URLs to NULL
  -- These should be re-uploaded properly
  UPDATE public.food_entries 
  SET photo_url = NULL,
      photo_storage_path = NULL,
      thumbnail_url = NULL
  WHERE photo_url LIKE 'data:%'
     OR photo_url ~ '^[A-Za-z0-9+/=]+$'; -- Base64 pattern
     
  -- Log how many were cleaned
  RAISE NOTICE 'Cleaned up base64 photo URLs in food_entries';
END;
$$;

-- Run the cleanup function
SELECT public.clean_base64_photo_urls();