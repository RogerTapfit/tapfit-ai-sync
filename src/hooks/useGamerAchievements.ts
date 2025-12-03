import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';

export interface GamerAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  badge_emoji: string;
  rarity: string;
  trigger_type: string;
  trigger_value: number;
  is_active: boolean;
}

export interface UserGamerAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  xp_awarded: number;
  coins_awarded: number;
  achievement?: GamerAchievement;
}

export const useGamerAchievements = (userId?: string) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<GamerAchievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserGamerAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUnlock, setNewUnlock] = useState<UserGamerAchievement | null>(null);

  const targetUserId = userId || user?.id;

  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gamer_achievements')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('trigger_value');

      if (error) throw error;
      setAchievements((data || []) as GamerAchievement[]);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  }, []);

  const fetchUserAchievements = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_gamer_achievements')
        .select(`
          *,
          achievement:gamer_achievements(*)
        `)
        .eq('user_id', targetUserId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setUserAchievements((data || []) as UserGamerAchievement[]);
    } catch (err) {
      console.error('Error fetching user achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchAchievements();
    fetchUserAchievements();
  }, [fetchAchievements, fetchUserAchievements]);

  const unlockAchievement = useCallback(async (achievementId: string): Promise<UserGamerAchievement | null> => {
    if (!user?.id) return null;

    // Check if already unlocked
    const existing = userAchievements.find(ua => ua.achievement_id === achievementId);
    if (existing) return null;

    // Find achievement details
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return null;

    try {
      const { data, error } = await supabase
        .from('user_gamer_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
          xp_awarded: achievement.xp_reward,
          coins_awarded: achievement.coin_reward,
        })
        .select(`
          *,
          achievement:gamer_achievements(*)
        `)
        .single();

      if (error) throw error;

      const newAchievement = data as UserGamerAchievement;

      // Update local state
      setUserAchievements(prev => [newAchievement, ...prev]);
      setNewUnlock(newAchievement);

      // Award XP and coins via RPC
      await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp_amount: achievement.xp_reward,
        p_source: 'achievement'
      });

      // Award coins
      await supabase.rpc('add_tap_coins', {
        _user_id: user.id,
        _amount: achievement.coin_reward,
        _transaction_type: 'achievement',
        _description: `Achievement: ${achievement.name}`,
        _reference_id: newAchievement.id
      });

      return newAchievement;
    } catch (err) {
      console.error('Error unlocking achievement:', err);
      return null;
    }
  }, [user?.id, userAchievements, achievements]);

  const clearNewUnlock = useCallback(() => {
    setNewUnlock(null);
  }, []);

  const isUnlocked = useCallback((achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  }, [userAchievements]);

  const getUnlockedCount = useCallback(() => {
    return userAchievements.length;
  }, [userAchievements]);

  const getTotalAchievements = useCallback(() => {
    return achievements.length;
  }, [achievements]);

  const getAchievementsByCategory = useCallback((category: string) => {
    return achievements.filter(a => a.category === category);
  }, [achievements]);

  const getRecentUnlocks = useCallback((limit: number = 5) => {
    return userAchievements.slice(0, limit);
  }, [userAchievements]);

  return {
    achievements,
    userAchievements,
    loading,
    unlockAchievement,
    isUnlocked,
    getUnlockedCount,
    getTotalAchievements,
    getAchievementsByCategory,
    getRecentUnlocks,
    newUnlock,
    clearNewUnlock,
    refetch: fetchUserAchievements,
  };
};
