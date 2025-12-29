import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FriendChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenge_type: string;
  target_value: number;
  target_unit: string;
  time_limit_days: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed' | 'expired';
  challenger_progress: number;
  challenged_progress: number;
  winner_id: string | null;
  coin_reward: number;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
  completed_at: string | null;
  challenger?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  challenged?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useFriendChallenges = (userId?: string) => {
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<FriendChallenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<FriendChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchChallenges();
    }
  }, [userId]);

  const fetchChallenges = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_challenges')
        .select('*')
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile info for challengers and challenged users
      const userIds = [...new Set(data?.flatMap(c => [c.challenger_id, c.challenged_id]) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedChallenges = (data || []).map(challenge => ({
        ...challenge,
        challenger: profileMap.get(challenge.challenger_id),
        challenged: profileMap.get(challenge.challenged_id)
      })) as FriendChallenge[];

      setChallenges(enrichedChallenges);
      setPendingChallenges(enrichedChallenges.filter(c => c.status === 'pending'));
      setActiveChallenges(enrichedChallenges.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Error fetching friend challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async (
    challengedId: string,
    challengeType: string,
    targetValue: number,
    targetUnit: string,
    timeLimitDays: number,
    message?: string,
    coinReward?: number
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friend_challenges')
        .insert({
          challenger_id: user.id,
          challenged_id: challengedId,
          challenge_type: challengeType,
          target_value: targetValue,
          target_unit: targetUnit,
          time_limit_days: timeLimitDays,
          message,
          coin_reward: coinReward || 50
        });

      if (error) throw error;

      toast.success('Challenge sent!');
      fetchChallenges();
      return true;
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
      return false;
    }
  };

  const acceptChallenge = async (challengeId: string): Promise<boolean> => {
    try {
      const now = new Date();
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      const endsAt = new Date(now.getTime() + challenge.time_limit_days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('friend_challenges')
        .update({
          status: 'active',
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Challenge accepted! Game on! 🎮');
      fetchChallenges();
      return true;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast.error('Failed to accept challenge');
      return false;
    }
  };

  const declineChallenge = async (challengeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friend_challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Challenge declined');
      fetchChallenges();
      return true;
    } catch (error) {
      console.error('Error declining challenge:', error);
      toast.error('Failed to decline challenge');
      return false;
    }
  };

  const getChallengeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'run_distance': '🏃 Run Distance',
      'walk_distance': '🚶 Walk Distance',
      'swim_distance': '🏊 Swim Distance',
      'run_time': '🏃 Run Time',
      'walk_time': '🚶 Walk Time',
      'swim_time': '🏊 Swim Time',
      'total_workouts': '💪 Total Workouts'
    };
    return labels[type] || type;
  };

  return {
    challenges,
    pendingChallenges,
    activeChallenges,
    loading,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    getChallengeTypeLabel,
    refetch: fetchChallenges
  };
};
