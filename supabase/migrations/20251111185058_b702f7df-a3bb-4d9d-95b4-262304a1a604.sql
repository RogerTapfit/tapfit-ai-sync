-- Add gender field to avatars table
ALTER TABLE public.avatars 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'neutral' CHECK (gender IN ('male', 'female', 'neutral'));