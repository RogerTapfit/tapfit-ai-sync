-- Add photo fields to alcohol_entries table
ALTER TABLE public.alcohol_entries 
ADD COLUMN photo_url text,
ADD COLUMN thumbnail_url text, 
ADD COLUMN photo_storage_path text;