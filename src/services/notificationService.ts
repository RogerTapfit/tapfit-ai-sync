import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  notification_type: 'new_follower' | 'pr_achievement' | 'workout_milestone' | 'achievement_unlocked' | 'streak_milestone' | 'cardio_completed';
  notification_data: any;
  reference_id: string | null;
  read: boolean;
  created_at: string;
  actor?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

class NotificationService {
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    // Fetch actor profiles
    const actorIds = [...new Set(data.map(n => n.actor_id))];
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', actorIds);

    const actorMap = new Map(actors?.map(a => [a.id, a]) || []);

    return data.map(notification => ({
      ...notification,
      actor: actorMap.get(notification.actor_id) || null
    })) as Notification[];
  }

  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  }

  async markAsRead(notificationIds: string[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('mark_notifications_read', {
      _user_id: user.id,
      _notification_ids: notificationIds
    });

    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }

    return true;
  }

  async markAllAsRead(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('mark_all_notifications_read', {
      _user_id: user.id
    });

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  }
}

export const notificationService = new NotificationService();
