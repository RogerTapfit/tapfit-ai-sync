-- Backfill avatar_id from avatar_data.character_type for legacy profiles
-- This migration updates profiles where avatar_id is NULL but avatar_data contains a character_type
-- We match against the avatars.name column (case-insensitive)

UPDATE profiles
SET avatar_id = avatars.id
FROM avatars
WHERE profiles.avatar_id IS NULL
  AND profiles.avatar_data->>'character_type' IS NOT NULL
  AND LOWER(avatars.name) = LOWER(profiles.avatar_data->>'character_type');

-- Add a comment to document this backfill
COMMENT ON COLUMN profiles.avatar_id IS 'References the selected robot avatar/coach for the user. Backfilled from avatar_data.character_type for legacy profiles.';