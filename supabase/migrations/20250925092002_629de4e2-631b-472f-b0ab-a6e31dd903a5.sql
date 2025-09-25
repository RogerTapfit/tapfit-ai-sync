-- Create photo upload monitoring table (without constraint that breaks existing data)
CREATE TABLE IF NOT EXISTS public.photo_upload_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  success boolean NOT NULL,
  error_message text,
  photo_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on photo upload logs
ALTER TABLE public.photo_upload_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for photo upload logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'photo_upload_logs' 
    AND policyname = 'Users can view their own upload logs'
  ) THEN
    CREATE POLICY "Users can view their own upload logs" ON public.photo_upload_logs
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'photo_upload_logs' 
    AND policyname = 'System can insert upload logs'
  ) THEN
    CREATE POLICY "System can insert upload logs" ON public.photo_upload_logs
    FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_photo_upload_logs_user_created 
ON public.photo_upload_logs(user_id, created_at DESC);

-- Create functions for monitoring and logging
CREATE OR REPLACE FUNCTION public.log_photo_upload_attempt(
  _user_id uuid,
  _success boolean,
  _error_message text DEFAULT NULL,
  _photo_count integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.photo_upload_logs (
    user_id,
    success,
    error_message,
    photo_count,
    created_at
  ) VALUES (
    _user_id,
    _success,
    _error_message,
    _photo_count,
    now()
  );
END;
$$;

-- Function to get upload success rate
CREATE OR REPLACE FUNCTION public.get_user_upload_success_rate(_user_id uuid, _days integer DEFAULT 7)
RETURNS TABLE(
  total_attempts bigint,
  successful_uploads bigint,
  success_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = true) as successful_uploads,
    CASE 
      WHEN COUNT(*) = 0 THEN 0::numeric
      ELSE ROUND((COUNT(*) FILTER (WHERE success = true)::numeric / COUNT(*)::numeric) * 100, 2)
    END as success_rate
  FROM public.photo_upload_logs
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '1 day' * _days;
END;
$$;