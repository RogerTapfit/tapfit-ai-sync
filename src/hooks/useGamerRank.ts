import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';

export interface GamerStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  prestige_level: number;
  current_level_xp: number;
  xp_to_next_level: number;
  rank_title: string;
  rank_icon: string;
  created_at: string;
  updated_at: string;
}

export interface XPAwardResult {
  xp_gained: number;
  total_xp: number;
  current_level: number;
  prestige_level: number;
  rank_title: string;
  rank_icon: string;
  level_up: boolean;
  prestige_up: boolean;
  coins_awarded: number;
  xp_to_next_level: number;
  current_level_xp: number;
}

export const useGamerRank = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GamerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastXPGain, setLastXPGain] = useState<{ amount: number; source: string } | null>(null);
  const [levelUpData, setLevelUpData] = useState<XPAwardResult | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_gamer_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching gamer stats:', error);
        return;
      }

      if (data) {
        setStats(data);
      } else {
        // Create initial stats for new users
        const { data: newStats, error: insertError } = await supabase
          .from('user_gamer_stats')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating gamer stats:', insertError);
        } else {
          setStats(newStats);
        }
      }
    } catch (err) {
      console.error('Error in fetchStats:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Listen for xpAwarded events from other parts of the app
  useEffect(() => {
    const handleXPAwarded = (event: CustomEvent<{ amount: number; source: string; result: XPAwardResult }>) => {
      const { amount, source, result } = event.detail;
      
      // Update local state with the result
      setStats(prev => prev ? {
        ...prev,
        total_xp: result.total_xp,
        current_level: result.current_level,
        prestige_level: result.prestige_level,
        current_level_xp: result.current_level_xp,
        xp_to_next_level: result.xp_to_next_level,
        rank_title: result.rank_title,
        rank_icon: result.rank_icon,
      } : null);

      // Set last XP gain for toast
      setLastXPGain({ amount, source });

      // Set level up data if leveled up
      if (result.level_up || result.prestige_up) {
        setLevelUpData(result);
      }
    };

    window.addEventListener('xpAwarded', handleXPAwarded as EventListener);
    return () => window.removeEventListener('xpAwarded', handleXPAwarded as EventListener);
  }, []);

  const awardXP = useCallback(async (amount: number, source: string): Promise<XPAwardResult | null> => {
    if (!user?.id || amount <= 0) return null;

    try {
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp_amount: amount,
        p_source: source
      });

      if (error) {
        console.error('Error awarding XP:', error);
        return null;
      }

      const result = data as unknown as XPAwardResult;
      
      // Update local state
      setStats(prev => prev ? {
        ...prev,
        total_xp: result.total_xp,
        current_level: result.current_level,
        prestige_level: result.prestige_level,
        current_level_xp: result.current_level_xp,
        xp_to_next_level: result.xp_to_next_level,
        rank_title: result.rank_title,
        rank_icon: result.rank_icon,
      } : null);

      // Set last XP gain for toast
      setLastXPGain({ amount, source });

      // Set level up data if leveled up
      if (result.level_up || result.prestige_up) {
        setLevelUpData(result);
      }

      return result;
    } catch (err) {
      console.error('Error in awardXP:', err);
      return null;
    }
  }, [user?.id]);

  const clearLastXPGain = useCallback(() => {
    setLastXPGain(null);
  }, []);

  const clearLevelUpData = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (!stats) return 0;
    return Math.min(100, (stats.current_level_xp / stats.xp_to_next_level) * 100);
  }, [stats]);

  return {
    stats,
    loading,
    awardXP,
    refetch: fetchStats,
    lastXPGain,
    clearLastXPGain,
    levelUpData,
    clearLevelUpData,
    getProgressPercentage,
  };
};
