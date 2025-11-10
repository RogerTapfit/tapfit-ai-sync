-- Fix search_path for cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.shared_menu_items
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  DELETE FROM public.shared_comparisons
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;