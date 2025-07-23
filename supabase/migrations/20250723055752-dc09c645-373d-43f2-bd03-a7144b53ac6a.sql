-- Create function to send workout notification via edge function
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
$$ LANGUAGE plpgsql;

-- Create trigger to fire after insert on smart_pin_data
CREATE TRIGGER send_workout_notification_trigger
  AFTER INSERT ON public.smart_pin_data
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_workout_notification();

-- Enable pg_net extension if not already enabled (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;