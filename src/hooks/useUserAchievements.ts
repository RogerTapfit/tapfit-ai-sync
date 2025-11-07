import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon: string | null;
  badge_color: string;
  rarity_level: string;
  coin_reward: number;
  unlocked_at?: string;
  coins_earned?: number;
}

export const useUserAchievements = (userId?: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserAchievements();
    }
  }, [userId]);

  const fetchUserAchievements = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          unlocked_at,
          coins_earned,
          achievements:achievement_id (
            id,
            name,
            description,
            badge_icon,
            badge_color,
            rarity_level,
            coin_reward
          )
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      const formattedAchievements = data?.map((item: any) => ({
        ...item.achievements,
        unlocked_at: item.unlocked_at,
        coins_earned: item.coins_earned,
      })) || [];

      setAchievements(formattedAchievements);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    achievements,
    loading,
    refetch: fetchUserAchievements,
  };
};
