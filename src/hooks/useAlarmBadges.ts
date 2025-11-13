import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { alarmBadges, type AlarmBadge } from '@/config/alarmBadges';
import { useToast } from '@/hooks/use-toast';

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  coins_awarded: number;
}

export const useAlarmBadges = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's unlocked badges
  const { data: unlockedBadges, isLoading } = useQuery({
    queryKey: ['alarm-badges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .like('achievement_id', 'alarm_%');

      if (error) throw error;

      // Map database fields to UserBadge interface
      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        badge_id: item.achievement_id.replace('alarm_', ''), // Remove prefix
        unlocked_at: item.unlocked_at,
        coins_awarded: item.coins_earned,
      })) as UserBadge[];
    },
  });

  // Check if a badge is unlocked
  const isBadgeUnlocked = (badgeId: string) => {
    return unlockedBadges?.some(badge => badge.badge_id === badgeId) || false;
  };

  // Unlock a badge
  const unlockBadge = useMutation({
    mutationFn: async (badge: AlarmBadge) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already unlocked
      if (isBadgeUnlocked(badge.id)) {
        return null;
      }

      // Insert badge
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: `alarm_${badge.id}`,
          badge_id: badge.id,
          coins_earned: badge.coinReward,
        })
        .select()
        .single();

      if (error) throw error;

      // Award coins
      await supabase.rpc('add_tap_coins', {
        _user_id: user.id,
        _amount: badge.coinReward,
        _transaction_type: 'alarm_badge',
        _description: `Badge unlocked: ${badge.name}`,
        _reference_id: data.id,
      });

      return data;
    },
    onSuccess: (data, badge) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['alarm-badges'] });
        
        // Show celebration toast
        toast({
          title: `🎉 Badge Unlocked: ${badge.name}!`,
          description: `${badge.description} • +${badge.coinReward} coins`,
          duration: 5000,
        });
      }
    },
  });

  // Check for new badge unlocks based on stats
  const checkForNewBadges = async (stats: {
    currentStreak: number;
    totalCompletions: number;
    recentCompletions: any[];
  }) => {
    const badgesToUnlock: AlarmBadge[] = [];

    // Check streak badges
    alarmBadges
      .filter(b => b.requirement.type === 'streak')
      .forEach(badge => {
        if (
          stats.currentStreak >= badge.requirement.value &&
          !isBadgeUnlocked(badge.id)
        ) {
          badgesToUnlock.push(badge);
        }
      });

    // Check total completion badges
    alarmBadges
      .filter(b => b.requirement.type === 'total_completions')
      .forEach(badge => {
        if (
          stats.totalCompletions >= badge.requirement.value &&
          !isBadgeUnlocked(badge.id)
        ) {
          badgesToUnlock.push(badge);
        }
      });

    // Check speed badges
    alarmBadges
      .filter(b => b.requirement.type === 'speed')
      .forEach(badge => {
        const hasFastCompletion = stats.recentCompletions.some(
          c => c.time_to_complete <= badge.requirement.value
        );
        if (hasFastCompletion && !isBadgeUnlocked(badge.id)) {
          badgesToUnlock.push(badge);
        }
      });

    // Check early bird badge
    const earlyBirdBadge = alarmBadges.find(b => b.id === 'early_bird');
    if (earlyBirdBadge && !isBadgeUnlocked(earlyBirdBadge.id)) {
      const earlyCompletions = stats.recentCompletions.filter(c => {
        const hour = new Date(c.completed_at).getHours();
        return hour < 7;
      });
      if (earlyCompletions.length >= earlyBirdBadge.requirement.value) {
        badgesToUnlock.push(earlyBirdBadge);
      }
    }

    // Check weekend warrior badge
    const weekendBadge = alarmBadges.find(b => b.id === 'weekend_warrior');
    if (weekendBadge && !isBadgeUnlocked(weekendBadge.id)) {
      const weekendCompletions = stats.recentCompletions.filter(c => {
        const day = new Date(c.completed_at).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      if (weekendCompletions.length >= weekendBadge.requirement.value) {
        badgesToUnlock.push(weekendBadge);
      }
    }

    // Unlock badges one by one with delay for better UX
    for (const badge of badgesToUnlock) {
      await unlockBadge.mutateAsync(badge);
      // Small delay between unlocks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return {
    unlockedBadges,
    isLoading,
    isBadgeUnlocked,
    unlockBadge: unlockBadge.mutateAsync,
    checkForNewBadges,
    allBadges: alarmBadges,
  };
};
