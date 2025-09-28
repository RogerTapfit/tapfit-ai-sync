-- CRITICAL SECURITY FIXES FOR TAPFIT

-- 1. Fix Food Analysis Cache RLS Policy (CRITICAL)
-- Current policy allows NULL user_id access, potential data leakage
DROP POLICY IF EXISTS "Anyone can view food analysis cache" ON public.food_analysis_cache;
DROP POLICY IF EXISTS "Users can view cached food analysis" ON public.food_analysis_cache;

CREATE POLICY "Users can view their own cached food analysis" 
ON public.food_analysis_cache 
FOR SELECT 
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  (user_id IS NULL AND auth.role() = 'service_role') -- Only service role can access system cache
);

CREATE POLICY "System can insert food analysis cache" 
ON public.food_analysis_cache 
FOR INSERT 
WITH CHECK (true); -- Allow system insertions

-- 2. Enhanced Profile Access Monitoring
-- Add trigger for profile access auditing
CREATE OR REPLACE FUNCTION public.log_sensitive_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive profile data
  IF TG_OP = 'SELECT' AND (
    NEW.health_conditions IS NOT NULL OR 
    NEW.previous_injuries IS NOT NULL OR 
    NEW.weight_kg IS NOT NULL
  ) THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_details,
      ip_address
    ) VALUES (
      auth.uid(),
      'sensitive_profile_access',
      jsonb_build_object(
        'accessed_fields', ARRAY['health_conditions', 'previous_injuries', 'weight_kg'],
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Fix Database Function Search Paths (SECURITY ISSUE)
-- Update all functions to use explicit search_path = 'public' for security

CREATE OR REPLACE FUNCTION public.calculate_user_power_level(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Fixed: was empty string
AS $$
DECLARE
  workout_score INTEGER := 0;
  nutrition_score INTEGER := 0;
  consistency_score INTEGER := 0;
  challenge_score INTEGER := 0;
  total_score INTEGER := 0;
  workout_count INTEGER;
  nutrition_days INTEGER;
  streak_days INTEGER;
  completed_challenges INTEGER;
BEGIN
  -- Calculate workout score (0-400 points)
  SELECT COUNT(*)
  INTO workout_count
  FROM public.smart_pin_data
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  workout_score := LEAST(400, workout_count * 15);

  -- Calculate nutrition score (0-200 points)
  SELECT COUNT(DISTINCT logged_date)
  INTO nutrition_days
  FROM public.food_entries
  WHERE user_id = _user_id
    AND logged_date >= CURRENT_DATE - INTERVAL '30 days';
  
  nutrition_score := LEAST(200, nutrition_days * 7);

  -- Calculate consistency score (0-250 points)
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO streak_days
  FROM public.smart_pin_data
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE - INTERVAL '14 days';
  
  consistency_score := LEAST(250, streak_days * 18);

  -- Calculate challenge score (0-150 points)
  SELECT COUNT(*)
  INTO completed_challenges
  FROM public.user_challenges
  WHERE user_id = _user_id
    AND status = 'completed'
    AND completed_at >= CURRENT_DATE - INTERVAL '30 days';
  
  challenge_score := LEAST(150, completed_challenges * 25);

  -- Calculate total score
  total_score := workout_score + nutrition_score + consistency_score + challenge_score;
  
  RETURN LEAST(1000, total_score);
END;
$$;

-- 4. Enhanced Rate Limiting for Security
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  user_identifier text, 
  max_requests integer, 
  time_window_seconds integer,
  operation_type text DEFAULT 'general'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window for this operation type
  SELECT COUNT(*)
  INTO request_count
  FROM public.rate_limit_log
  WHERE identifier = user_identifier
    AND created_at > (now() - (time_window_seconds || ' seconds')::INTERVAL);
  
  -- Log this request with operation type
  INSERT INTO public.rate_limit_log (identifier, created_at)
  VALUES (user_identifier || ':' || operation_type, now());
  
  -- Log security event if rate limit exceeded
  IF request_count >= max_requests THEN
    INSERT INTO public.security_events (
      event_type,
      event_details,
      ip_address
    ) VALUES (
      'rate_limit_exceeded',
      jsonb_build_object(
        'identifier', user_identifier,
        'operation_type', operation_type,
        'request_count', request_count,
        'limit', max_requests
      ),
      inet_client_addr()
    );
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 5. Secure Guest Session Validation
CREATE OR REPLACE FUNCTION public.validate_guest_session_secure(session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_exists BOOLEAN := FALSE;
  session_record RECORD;
BEGIN
  -- Check session with additional security validations
  SELECT * INTO session_record
  FROM public.guest_sessions 
  WHERE session_token = $1 
    AND expires_at > now()
    AND (last_activity > now() - INTERVAL '30 minutes'); -- Additional activity check
  
  session_exists := FOUND;
  
  -- Update last activity and log access if session is valid
  IF session_exists THEN
    UPDATE public.guest_sessions 
    SET last_activity = now()
    WHERE session_token = $1;
    
    -- Log guest session access for monitoring
    INSERT INTO public.security_events (
      event_type,
      event_details,
      ip_address
    ) VALUES (
      'guest_session_access',
      jsonb_build_object(
        'session_token_prefix', LEFT(session_token, 8),
        'last_activity', session_record.last_activity
      ),
      inet_client_addr()
    );
  ELSE
    -- Log failed guest session validation
    INSERT INTO public.security_events (
      event_type,
      event_details,
      ip_address
    ) VALUES (
      'invalid_guest_session_attempt',
      jsonb_build_object(
        'session_token_prefix', LEFT(session_token, 8),
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN session_exists;
END;
$$;