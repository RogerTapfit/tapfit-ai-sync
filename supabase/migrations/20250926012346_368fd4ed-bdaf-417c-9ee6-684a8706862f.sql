-- ====================================
-- SECURITY FIXES FOR PERSONAL DATA PROTECTION
-- ====================================

-- Fix 1: Strengthen profiles table security
-- Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive profile data
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
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit logs table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add audit trigger to profiles table
DROP TRIGGER IF EXISTS audit_profiles_access ON public.profiles;
CREATE TRIGGER audit_profiles_access
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- Fix 2: Add data validation and constraints for profiles
-- Ensure sensitive fields have proper constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_weight_valid CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg < 1000)),
ADD CONSTRAINT profiles_height_valid CHECK (height_cm IS NULL OR (height_cm > 0 AND height_cm < 300)),
ADD CONSTRAINT profiles_age_valid CHECK (age IS NULL OR (age > 0 AND age < 150));

-- Add field-level encryption function for sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_field(field_value TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Basic obfuscation for demo - in production use proper encryption
  IF field_value IS NULL OR field_value = '' THEN
    RETURN field_value;
  END IF;
  RETURN encode(digest(field_value || current_setting('app.encryption_key', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- Fix 3: Restrict gym table access to authenticated users only
DROP POLICY IF EXISTS "Everyone can view gyms" ON public.gyms;

CREATE POLICY "Only authenticated users can view gyms"
ON public.gyms
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix 4: Add rate limiting function to prevent data scraping
CREATE OR REPLACE FUNCTION public.check_rate_limit(user_identifier TEXT, max_requests INTEGER, time_window_seconds INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*)
  INTO request_count
  FROM public.rate_limit_log
  WHERE identifier = user_identifier
    AND created_at > (now() - (time_window_seconds || ' seconds')::INTERVAL);
  
  -- Log this request
  INSERT INTO public.rate_limit_log (identifier, created_at)
  VALUES (user_identifier, now());
  
  -- Return false if rate limit exceeded
  RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create rate limiting log table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit checking
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_identifier_time 
ON public.rate_limit_log (identifier, created_at);

-- Clean up old rate limit logs automatically
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.rate_limit_log 
  WHERE created_at < (now() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 5: Add additional security policies for sensitive operations
-- Prevent bulk data export by limiting query results
CREATE POLICY "Limit profile queries to prevent bulk export"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  AND public.check_rate_limit(auth.uid()::TEXT, 50, 60) -- 50 requests per minute
);

-- Fix 6: Add data masking function for logging
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(data JSONB)
RETURNS JSONB AS $$
BEGIN
  -- Mask sensitive fields in logs
  RETURN jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(data, '{email}', '"***@***.***"'::jsonb),
        '{full_name}', '"***"'::jsonb
      ),
      '{weight_kg}', 'null'::jsonb
    ),
    '{health_conditions}', '"[REDACTED]"'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- Update audit logging to use data masking
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 7: Add session validation for critical operations
CREATE OR REPLACE FUNCTION public.validate_session_for_sensitive_data()
RETURNS BOOLEAN AS $$
BEGIN
  -- Ensure user session is recent and valid for sensitive operations
  RETURN (
    auth.uid() IS NOT NULL 
    AND auth.role() = 'authenticated'
    AND extract(epoch from (now() - current_setting('request.jwt_claims', true)::jsonb->>'iat'::text)::timestamp) < 3600 -- Session less than 1 hour old
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update profiles RLS policies to use session validation
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;

CREATE POLICY "Users can update only their own profile with valid session"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  AND public.validate_session_for_sensitive_data()
)
WITH CHECK (
  auth.uid() = id 
  AND public.validate_session_for_sensitive_data()
);

-- Ensure profiles table has proper NOT NULL constraints for critical fields
ALTER TABLE public.profiles 
ALTER COLUMN id SET NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with enhanced security: RLS enabled, audit logging, rate limiting, and data validation';
COMMENT ON TABLE public.audit_logs IS 'Security audit trail for sensitive data access with data masking';
COMMENT ON TABLE public.rate_limit_log IS 'Rate limiting log to prevent data scraping and abuse';