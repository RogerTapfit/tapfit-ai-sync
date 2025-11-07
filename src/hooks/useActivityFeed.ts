import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { activityFeedService, ActivityFeedItem } from '@/services/activityFeedService';

export const useActivityFeed = (limit: number = 20) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await activityFeedService.getActivityFeed(limit);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('activity-feed-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        (payload) => {
          console.log('New activity:', payload);
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return {
    activities,
    loading,
    refetch: fetchActivities
  };
};
