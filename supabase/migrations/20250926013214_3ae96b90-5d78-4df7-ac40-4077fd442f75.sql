-- ====================================
-- COMPREHENSIVE SECURITY FIXES
-- ====================================

-- Fix 1: Add proper RLS to food_analysis_cache table
DROP POLICY IF EXISTS "System can insert cache entries" ON public.food_analysis_cache;
DROP POLICY IF EXISTS "System can update cache hits" ON public.food_analysis_cache;
DROP POLICY IF EXISTS "Users can view cached analyses" ON public.food_analysis_cache;

-- Create more secure policies for food_analysis_cache
CREATE POLICY "Users can view their own cached analyses"
ON public.food_analysis_cache
FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "System can insert cache entries for users"
ON public.food_analysis_cache
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "System can update cache hits for users"
ON public.food_analysis_cache
FOR UPDATE
USING (user_id IS NULL OR user_id = auth.uid());

-- Fix 2: Restrict gym information access to associated users only
DROP POLICY IF EXISTS "Only authenticated users can view gyms" ON public.gyms;

CREATE POLICY "Users can view gyms they belong to"
ON public.gyms
FOR SELECT
USING (
  auth.role() = 'authenticated' AND 
  (
    id IN (SELECT gym_id FROM public.profiles WHERE id = auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix 3: Add guest session tracking table
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Guest sessions can be managed by anyone (for cleanup and validation)
CREATE POLICY "Guest sessions can be managed by system"
ON public.guest_sessions
FOR ALL
USING (true);

-- Fix 4: Add security event logging table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security events"
ON public.security_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert security events
CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

-- Fix 5: Add data retention policies function
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up old guest sessions (older than 1 day)
  DELETE FROM public.guest_sessions 
  WHERE expires_at < (now() - INTERVAL '1 day');
  
  -- Clean up old rate limit logs (older than 1 day)
  DELETE FROM public.rate_limit_log 
  WHERE created_at < (now() - INTERVAL '1 day');
  
  -- Clean up old security events (older than 90 days, except critical events)
  DELETE FROM public.security_events 
  WHERE created_at < (now() - INTERVAL '90 days')
    AND event_type NOT IN ('admin_access', 'data_breach_attempt', 'multiple_failed_logins');
    
  -- Clean up old photo upload logs (older than 30 days)
  DELETE FROM public.photo_upload_logs
  WHERE created_at < (now() - INTERVAL '30 days');
END;
$$;

-- Fix 6: Add function to validate guest sessions
CREATE OR REPLACE FUNCTION public.validate_guest_session(session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_exists BOOLEAN := FALSE;
BEGIN
  -- Check if session exists and is not expired
  SELECT EXISTS(
    SELECT 1 FROM public.guest_sessions 
    WHERE session_token = $1 
    AND expires_at > now()
  ) INTO session_exists;
  
  -- Update last activity if session is valid
  IF session_exists THEN
    UPDATE public.guest_sessions 
    SET last_activity = now()
    WHERE session_token = $1;
  END IF;
  
  RETURN session_exists;
END;
$$;

-- Fix 7: Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id UUID DEFAULT NULL,
  _event_type TEXT DEFAULT 'unknown',
  _event_details JSONB DEFAULT '{}',
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent
  ) VALUES (
    _user_id,
    _event_type,
    _event_details,
    _ip_address,
    _user_agent
  );
END;
$$;

-- Fix 8: Enhanced profile security constraints
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_email_valid;

-- Add email validation constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_valid 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Fix 9: Add trigger for profile access logging
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive profile data with masked sensitive fields
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    operation,
    old_data,
    new_data,
    accessed_at
  ) VALUES (
    auth.uid(),
    'profiles',
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN public.mask_sensitive_data(row_to_json(OLD)::jsonb) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN public.mask_sensitive_data(row_to_json(NEW)::jsonb) ELSE NULL END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for profile access logging
DROP TRIGGER IF EXISTS profile_access_log ON public.profiles;
CREATE TRIGGER profile_access_log
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();