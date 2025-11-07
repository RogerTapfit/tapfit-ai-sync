-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_follower', 'pr_achievement', 'workout_milestone', 'achievement_unlocked', 'streak_milestone')),
  notification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = false;
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Function to create notification for new follower
CREATE OR REPLACE FUNCTION public.create_follower_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification for active follows
  IF NEW.status = 'active' THEN
    INSERT INTO public.notifications (
      user_id,
      actor_id,
      notification_type,
      notification_data,
      reference_id
    )
    VALUES (
      NEW.following_id,
      NEW.follower_id,
      'new_follower',
      jsonb_build_object(
        'follower_id', NEW.follower_id
      ),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for new followers
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follower_notification();

-- Function to notify followers of activity
CREATE OR REPLACE FUNCTION public.notify_followers_of_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_record RECORD;
  notification_type_map TEXT;
BEGIN
  -- Map activity types to notification types
  notification_type_map := CASE NEW.activity_type
    WHEN 'pr' THEN 'pr_achievement'
    WHEN 'workout_milestone' THEN 'workout_milestone'
    WHEN 'achievement' THEN 'achievement_unlocked'
    WHEN 'streak_milestone' THEN 'streak_milestone'
    ELSE NULL
  END;

  -- Only create notifications for mapped types
  IF notification_type_map IS NOT NULL THEN
    -- Create notification for each follower
    FOR follower_record IN 
      SELECT follower_id 
      FROM public.user_follows 
      WHERE following_id = NEW.user_id 
        AND status = 'active'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        actor_id,
        notification_type,
        notification_data,
        reference_id
      )
      VALUES (
        follower_record.follower_id,
        NEW.user_id,
        notification_type_map,
        NEW.activity_data,
        NEW.reference_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to notify followers when activity is created
CREATE TRIGGER on_activity_notify_followers
  AFTER INSERT ON public.activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_of_activity();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(_user_id UUID, _notification_ids UUID[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = _user_id
    AND id = ANY(_notification_ids);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = _user_id
    AND read = false;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;