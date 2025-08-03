-- Add missing triggers for automatic daily nutrition summary updates
CREATE OR REPLACE TRIGGER food_entries_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.food_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_nutrition_summary_refresh();

-- Add performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_food_entries_user_logged_date 
  ON public.food_entries (user_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_food_entries_created_at 
  ON public.food_entries (created_at);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_summary_user_date 
  ON public.daily_nutrition_summary (user_id, summary_date);

-- Add data validation constraints
ALTER TABLE public.food_entries 
  ADD CONSTRAINT check_positive_calories 
  CHECK (total_calories >= 0);

ALTER TABLE public.food_entries 
  ADD CONSTRAINT check_positive_macros 
  CHECK (total_protein >= 0 AND total_carbs >= 0 AND total_fat >= 0);

ALTER TABLE public.food_entries 
  ADD CONSTRAINT check_valid_meal_type 
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other'));

-- Ensure replica identity is set for real-time updates
ALTER TABLE public.food_entries REPLICA IDENTITY FULL;

-- Add data cleanup function for old entries (optional maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_food_entries(_days_to_keep integer DEFAULT 365)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only delete entries older than specified days and keep daily summaries
  DELETE FROM public.food_entries 
  WHERE logged_date < CURRENT_DATE - INTERVAL '1 day' * _days_to_keep;
END;
$function$;