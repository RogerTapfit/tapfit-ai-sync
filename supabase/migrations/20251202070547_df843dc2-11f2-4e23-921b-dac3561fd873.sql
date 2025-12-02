-- Add new columns to water_intake table for comprehensive beverage tracking
ALTER TABLE water_intake 
ADD COLUMN IF NOT EXISTS beverage_type TEXT DEFAULT 'water',
ADD COLUMN IF NOT EXISTS total_amount_ml INTEGER,
ADD COLUMN IF NOT EXISTS effective_hydration_ml INTEGER,
ADD COLUMN IF NOT EXISTS is_dehydrating BOOLEAN DEFAULT false;

-- Update existing records to have the new columns populated
UPDATE water_intake 
SET 
  beverage_type = 'water',
  total_amount_ml = amount_ml,
  effective_hydration_ml = amount_ml,
  is_dehydrating = false
WHERE beverage_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN water_intake.beverage_type IS 'Type of beverage consumed (water, coffee, beer, etc)';
COMMENT ON COLUMN water_intake.total_amount_ml IS 'Total liquid volume consumed in milliliters';
COMMENT ON COLUMN water_intake.effective_hydration_ml IS 'Calculated effective hydration in milliliters (can be negative for alcohol)';
COMMENT ON COLUMN water_intake.is_dehydrating IS 'Flag indicating if the beverage has a dehydrating effect (alcohol)';