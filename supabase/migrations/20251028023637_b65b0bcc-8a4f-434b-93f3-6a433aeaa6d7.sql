-- Add unit preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_preference TEXT DEFAULT 'imperial' CHECK (unit_preference IN ('imperial', 'metric'));

-- Add comment explaining the field
COMMENT ON COLUMN profiles.unit_preference IS 'User preference for displaying weights and heights: imperial (lbs, ft, in) or metric (kg, cm)';