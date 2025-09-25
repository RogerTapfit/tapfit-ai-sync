-- Create food analysis cache table for consistent results
CREATE TABLE public.food_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash TEXT NOT NULL UNIQUE,
  analysis_result JSONB NOT NULL,
  meal_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  user_id UUID REFERENCES auth.users(id),
  cache_hits INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.food_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view cached analyses" 
ON public.food_analysis_cache 
FOR SELECT 
USING (true); -- Cache is public for efficiency

CREATE POLICY "System can insert cache entries" 
ON public.food_analysis_cache 
FOR INSERT 
WITH CHECK (true); -- System can cache any analysis

CREATE POLICY "System can update cache hits" 
ON public.food_analysis_cache 
FOR UPDATE 
USING (true); -- System can update hit counts

-- Create index for fast hash lookups
CREATE INDEX idx_food_analysis_cache_hash ON public.food_analysis_cache(image_hash);

-- Create index for cleanup of expired entries
CREATE INDEX idx_food_analysis_cache_expires ON public.food_analysis_cache(expires_at);

-- Add cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_food_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.food_analysis_cache 
  WHERE expires_at < now();
END;
$function$;