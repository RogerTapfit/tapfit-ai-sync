-- Add optional accent_hex color for avatar glow
ALTER TABLE public.avatars
  ADD COLUMN IF NOT EXISTS accent_hex text;