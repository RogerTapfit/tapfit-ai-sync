-- Fix security issue: Recreate function with proper security settings
-- Drop trigger first, then function, then recreate both with security settings

DROP TRIGGER IF EXISTS update_saved_menu_items_updated_at ON public.saved_menu_items;
DROP FUNCTION IF EXISTS public.update_saved_menu_items_updated_at() CASCADE;

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION public.update_saved_menu_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_saved_menu_items_updated_at
  BEFORE UPDATE ON public.saved_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_menu_items_updated_at();