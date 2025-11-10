import { useState, useEffect } from 'react';
import { nutritionChallengeService, NutritionChallenge, NutritionChallengeParticipant } from '@/services/nutritionChallengeService';
import { toast } from 'sonner';

export const useNutritionChallenges = () => {
  const [challenges, setChallenges] = useState<NutritionChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const data = await nutritionChallengeService.getActiveChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load nutrition challenges');
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      await nutritionChallengeService.joinChallenge(challengeId);
      toast.success('Joined challenge successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to join challenge');
      return false;
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    try {
      const success = await nutritionChallengeService.leaveChallenge(challengeId);
      if (success) {
        toast.success('Left challenge');
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to leave challenge');
      return false;
    }
  };

  return {
    challenges,
    loading,
    joinChallenge,
    leaveChallenge,
    refetch: fetchChallenges
  };
};

export const useNutritionChallengeLeaderboard = (challengeId: string | null) => {
  const [leaderboard, setLeaderboard] = useState<NutritionChallengeParticipant[]>([]);
  const [userParticipation, setUserParticipation] = useState<NutritionChallengeParticipant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (challengeId) {
      fetchLeaderboard();
    }
  }, [challengeId]);

  const fetchLeaderboard = async () => {
    if (!challengeId) return;

    setLoading(true);
    try {
      const [leaderboardData, participationData] = await Promise.all([
        nutritionChallengeService.getChallengeLeaderboard(challengeId),
        nutritionChallengeService.getUserParticipation(challengeId)
      ]);

      setLeaderboard(leaderboardData);
      setUserParticipation(participationData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return {
    leaderboard,
    userParticipation,
    loading,
    refetch: fetchLeaderboard
  };
};
