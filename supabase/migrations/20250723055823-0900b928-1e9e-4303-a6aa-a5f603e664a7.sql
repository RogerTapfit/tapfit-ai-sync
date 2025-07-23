-- Fix security issues

-- 1. Fix function search path security issue
CREATE OR REPLACE FUNCTION public.trigger_workout_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://pbrayxmqzdxsmhqmzygc.supabase.co/functions/v1/sendWorkoutNotification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicmF5eG1xemR4c21ocW16eWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDU5NDUsImV4cCI6MjA2ODgyMTk0NX0.n4SNUD5IOyT2Pjp63sQdDFWIoIwAbzCWiwU2-jjjngo'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'machine_id', NEW.machine_id,
      'reps', NEW.reps,
      'sets', NEW.sets,
      'weight', NEW.weight,
      'muscle_group', NEW.muscle_group
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Move pg_net extension to extensions schema instead of public
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;