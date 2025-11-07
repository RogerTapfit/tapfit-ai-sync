import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserChallenge {
  id: string;
  challenge_id: string;
  user_id: string;
  current_progress: number;
  target_value: number;
  started_at: string;
  completed_at: string | null;
  status: string;
  challenge: {
    name: string;
    description: string;
    challenge_type: string;
    difficulty_level: string;
    time_limit_days: number | null;
    coin_reward: number;
    bonus_coin_reward: number | null;
  };
}

export const useUserChallenges = (userId?: string) => {
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserChallenges();
    }
  }, [userId]);

  const fetchUserChallenges = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          id,
          challenge_id,
          user_id,
          current_progress,
          target_value,
          started_at,
          completed_at,
          status,
          challenges:challenge_id (
            name,
            description,
            challenge_type,
            difficulty_level,
            time_limit_days,
            coin_reward,
            bonus_coin_reward
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedChallenges = data?.map((item: any) => ({
        id: item.id,
        challenge_id: item.challenge_id,
        user_id: item.user_id,
        current_progress: item.current_progress,
        target_value: item.target_value,
        started_at: item.started_at,
        completed_at: item.completed_at,
        status: item.status,
        challenge: item.challenges,
      })) || [];

      setChallenges(formattedChallenges);
    } catch (error) {
      console.error('Error fetching user challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return {
    challenges,
    activeChallenges,
    completedChallenges,
    loading,
    refetch: fetchUserChallenges,
  };
};
