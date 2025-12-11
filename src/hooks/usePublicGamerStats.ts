import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublicGamerStats {
  total_xp: number;
  current_level: number;
  prestige_level: number;
  rank_title: string;
  rank_icon: string;
  current_level_xp: number;
  xp_to_next_level: number;
}

export const usePublicGamerStats = (userId: string | null) => {
  const [stats, setStats] = useState<PublicGamerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_gamer_stats')
          .select('total_xp, current_level, prestige_level, rank_title, rank_icon, current_level_xp, xp_to_next_level')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching gamer stats:', error);
        }

        setStats(data as PublicGamerStats | null);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const getProgressPercentage = () => {
    if (!stats) return 0;
    return Math.min(100, (stats.current_level_xp / stats.xp_to_next_level) * 100);
  };

  return { stats, loading, getProgressPercentage };
};
