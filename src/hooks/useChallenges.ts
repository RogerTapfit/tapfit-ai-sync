import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isGuestMode } from '@/lib/utils';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  challenge_type: 'workout_count' | 'streak' | 'muscle_group' | 'calories' | 'steps' | 'custom';
  target_value: number;
  time_limit_days?: number;
  coin_reward: number;
  bonus_coin_reward: number;
  is_active: boolean;
  is_recurring: boolean;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'extreme';
  created_at: string;
  updated_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  target_value: number;
  status: 'active' | 'completed' | 'failed' | 'expired';
  started_at: string;
  completed_at?: string;
  expires_at?: string;
  coins_earned: number;
  early_completion_bonus: boolean;
  challenge: Challenge;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  achievement_type: 'workout_milestone' | 'streak_milestone' | 'stats_milestone' | 'special';
  trigger_condition: any;
  coin_reward: number;
  badge_icon?: string;
  badge_color: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  rarity_level: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  coins_earned: number;
  achievement: Achievement;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0);
  const { toast } = useToast();

  // Fetch all available challenges
  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      setChallenges((data || []) as Challenge[]);
    } catch (error: any) {
      toast({
        title: "Error fetching challenges",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch user's active and completed challenges
  const fetchUserChallenges = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserChallenges((data || []) as UserChallenge[]);
    } catch (error: any) {
      toast({
        title: "Error fetching user challenges",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch all available achievements
  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('coin_reward', { ascending: true });

      if (error) throw error;
      setAchievements((data || []) as Achievement[]);
    } catch (error: any) {
      toast({
        title: "Error fetching achievements",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch user's unlocked achievements
  const fetchUserAchievements = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setUserAchievements((data || []) as UserAchievement[]);

      // Calculate total coins earned from challenges and achievements
      const challengeCoins = userChallenges.reduce((sum, uc) => sum + uc.coins_earned, 0);
      const achievementCoins = (data || []).reduce((sum, ua) => sum + ua.coins_earned, 0);
      setTotalCoinsEarned(challengeCoins + achievementCoins);
    } catch (error: any) {
      toast({
        title: "Error fetching user achievements",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Join a challenge
  const joinChallenge = async (challengeId: string) => {
    try {
      if (isGuestMode()) {
        toast({ title: 'Guest Mode', description: 'Create an account to join challenges.', variant: 'destructive' });
        return;
      }
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      // Check if user already has an active challenge of this type
      const existingActive = userChallenges.find(
        uc => uc.challenge_id === challengeId && uc.status === 'active'
      );
      if (existingActive) {
        toast({
          title: "Already participating",
          description: "You're already participating in this challenge!",
          variant: "destructive",
        });
        return;
      }

      const expiresAt = challenge.time_limit_days 
        ? new Date(Date.now() + challenge.time_limit_days * 24 * 60 * 60 * 1000)
        : null;

      const { error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.user.id,
          challenge_id: challengeId,
          target_value: challenge.target_value,
          expires_at: expiresAt?.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Challenge joined!",
        description: `You've joined "${challenge.name}". Good luck!`,
      });

      fetchUserChallenges();
    } catch (error: any) {
      toast({
        title: "Error joining challenge",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update challenge progress
  const updateChallengeProgress = async (userChallengeId: string, newProgress: number) => {
    try {
      if (isGuestMode()) {
        toast({ title: 'Guest Mode', description: 'Progress isn’t saved in guest mode.', variant: 'destructive' });
        return;
      }
      const userChallenge = userChallenges.find(uc => uc.id === userChallengeId);
      if (!userChallenge) return;

      const isCompleted = newProgress >= userChallenge.target_value;
      const updates: any = {
        current_progress: newProgress,
      };

      if (isCompleted && userChallenge.status === 'active') {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
        
        // Calculate coin reward (base + bonus if early)
        let coinReward = userChallenge.challenge.coin_reward;
        const isEarly = userChallenge.expires_at && new Date() < new Date(userChallenge.expires_at);
        
        if (isEarly && userChallenge.challenge.bonus_coin_reward > 0) {
          coinReward += userChallenge.challenge.bonus_coin_reward;
          updates.early_completion_bonus = true;
        }
        
        updates.coins_earned = coinReward;

        // Award coins using the database function
        await supabase.rpc('award_challenge_coins', {
          _user_id: userChallenge.user_id,
          _amount: coinReward,
          _reference_id: userChallengeId,
          _type: 'challenge_completion'
        });
      }

      const { error } = await supabase
        .from('user_challenges')
        .update(updates)
        .eq('id', userChallengeId);

      if (error) throw error;

      if (isCompleted) {
        toast({
          title: "Challenge completed! 🎉",
          description: `You earned ${updates.coins_earned} Tap Coins!`,
        });
      }

      fetchUserChallenges();
    } catch (error: any) {
      toast({
        title: "Error updating challenge progress",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Check and unlock achievements based on user stats
  const checkAchievements = async (stats: {
    workoutCount?: number;
    streakDays?: number;
    uniqueMachines?: number;
    totalWeight?: number;
  }) => {
    try {
      if (isGuestMode()) {
        toast({ title: 'Guest Mode', description: 'Achievements are disabled in guest mode.', variant: 'destructive' });
        return;
      }
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const unlockedAchievementIds = userAchievements.map(ua => ua.achievement_id);
      
      for (const achievement of achievements) {
        if (unlockedAchievementIds.includes(achievement.id)) continue;

        const condition = achievement.trigger_condition;
        let shouldUnlock = false;

        switch (achievement.achievement_type) {
          case 'workout_milestone':
            shouldUnlock = stats.workoutCount >= condition.workout_count;
            break;
          case 'streak_milestone':
            shouldUnlock = stats.streakDays >= condition.streak_days;
            break;
          case 'stats_milestone':
            if (condition.unique_machines && stats.uniqueMachines >= condition.unique_machines) {
              shouldUnlock = true;
            } else if (condition.total_weight && stats.totalWeight >= condition.total_weight) {
              shouldUnlock = true;
            }
            break;
        }

        if (shouldUnlock) {
          // Unlock achievement
          await supabase.from('user_achievements').insert({
            user_id: user.user.id,
            achievement_id: achievement.id,
            coins_earned: achievement.coin_reward
          });

          // Award coins
          await supabase.rpc('award_challenge_coins', {
            _user_id: user.user.id,
            _amount: achievement.coin_reward,
            _reference_id: achievement.id,
            _type: 'achievement_unlock'
          });

          toast({
            title: `Achievement unlocked! ${achievement.badge_icon}`,
            description: `"${achievement.name}" - You earned ${achievement.coin_reward} Tap Coins!`,
          });
        }
      }

      fetchUserAchievements();
    } catch (error: any) {
      console.error('Error checking achievements:', error);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchAchievements();
    fetchUserChallenges();
    fetchUserAchievements();
  }, []);

  return {
    challenges,
    userChallenges,
    achievements,
    userAchievements,
    totalCoinsEarned,
    loading,
    joinChallenge,
    updateChallengeProgress,
    checkAchievements,
    refetch: () => {
      fetchChallenges();
      fetchUserChallenges();
      fetchAchievements();
      fetchUserAchievements();
    }
  };
};