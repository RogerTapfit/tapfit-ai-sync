import { useState, useEffect } from 'react';
import { socialService, UserWithStats } from '@/services/socialService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNetworkList = () => {
  const [followers, setFollowers] = useState<UserWithStats[]>([]);
  const [following, setFollowing] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const [followersData, followingData] = await Promise.all([
        socialService.getFollowers(user.id),
        socialService.getFollowing(user.id)
      ]);

      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error('Error fetching network:', error);
      toast.error('Failed to load network');
    } finally {
      setLoading(false);
    }
  };

  return {
    followers,
    following,
    loading,
    currentUserId,
    refetch: fetchNetwork
  };
};
