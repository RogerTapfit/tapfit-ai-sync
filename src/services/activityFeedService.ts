import { supabase } from '@/integrations/supabase/client';

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: 'pr' | 'achievement' | 'workout_milestone' | 'streak_milestone';
  activity_data: any;
  reference_id: string | null;
  created_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

class ActivityFeedService {
  async getActivityFeed(limit: number = 20): Promise<ActivityFeedItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }

    // Fetch profile data separately
    const userIds = [...new Set(data.map(item => item.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(item => ({
      ...item,
      profile: profileMap.get(item.user_id) || null
    })) as ActivityFeedItem[];
  }

  async getActivityFeedForUser(userId: string, limit: number = 10): Promise<ActivityFeedItem[]> {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user activity feed:', error);
      return [];
    }

    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single();

    return data.map(item => ({
      ...item,
      profile: profile || null
    })) as ActivityFeedItem[];
  }
}

export const activityFeedService = new ActivityFeedService();
