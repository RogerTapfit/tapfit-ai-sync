-- Fix PUBLIC_DATA_EXPOSURE: Guest sessions table has overly permissive RLS policy
-- Drop the current permissive policy that allows anyone to read/write all sessions
DROP POLICY IF EXISTS "Guest sessions can be managed by system" ON public.guest_sessions;

-- Create a new secure policy that only allows service_role access
-- This ensures only server-side operations (via service role key) can manage guest sessions
CREATE POLICY "Service role manages guest sessions"
ON public.guest_sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');