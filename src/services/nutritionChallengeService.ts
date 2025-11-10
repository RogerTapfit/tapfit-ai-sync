import { supabase } from '@/integrations/supabase/client';

export interface NutritionChallenge {
  id: string;
  name: string;
  description: string | null;
  challenge_type: 'best_average_grade' | 'meals_above_grade' | 'healthy_meal_streak' | 'weekly_health_score';
  target_metric: 'avg_grade' | 'meal_count' | 'streak_days' | 'total_score';
  start_date: string;
  end_date: string;
  min_meals_required: number;
  coin_reward: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  total_meals: number;
  meals_above_target: number;
  average_grade_score: number;
  current_streak: number;
  total_health_score: number;
  rank: number | null;
  coins_earned: number;
  joined_at: string;
  last_updated: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

class NutritionChallengeService {
  async getActiveChallenges(): Promise<NutritionChallenge[]> {
    const { data, error } = await supabase
      .from('nutrition_challenges')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching nutrition challenges:', error);
      return [];
    }

    return data as NutritionChallenge[];
  }

  async joinChallenge(challengeId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('nutrition_challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id
        });

      if (error) {
        // Check if already joined
        if (error.code === '23505') {
          throw new Error('Already joined this challenge');
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  async leaveChallenge(challengeId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('nutrition_challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving challenge:', error);
      return false;
    }
  }

  async getChallengeLeaderboard(challengeId: string): Promise<NutritionChallengeParticipant[]> {
    const { data, error } = await supabase
      .from('nutrition_challenge_participants')
      .select(`
        *,
        profiles!user_id (username, full_name, avatar_url)
      `)
      .eq('challenge_id', challengeId)
      .order('rank', { ascending: true, nullsFirst: false })
      .order('average_grade_score', { ascending: false });

    if (error) {
      console.error('Error fetching challenge leaderboard:', error);
      return [];
    }

    // Transform the data to match our interface
    return (data || []).map(item => ({
      ...item,
      profile: item.profiles as any
    })) as NutritionChallengeParticipant[];
  }

  async getUserParticipation(challengeId: string): Promise<NutritionChallengeParticipant | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('nutrition_challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user participation:', error);
        return null;
      }

      return data as NutritionChallengeParticipant | null;
    } catch (error) {
      console.error('Error fetching user participation:', error);
      return null;
    }
  }

  async updateParticipantProgress(
    challengeId: string,
    metrics: {
      total_meals?: number;
      meals_above_target?: number;
      average_grade_score?: number;
      current_streak?: number;
      total_health_score?: number;
    }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('nutrition_challenge_participants')
        .update({
          ...metrics,
          last_updated: new Date().toISOString()
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating participant progress:', error);
      return false;
    }
  }

  async calculateAndUpdateRankings(challengeId: string): Promise<void> {
    try {
      // Get challenge details
      const { data: challenge } = await supabase
        .from('nutrition_challenges')
        .select('target_metric, min_meals_required')
        .eq('id', challengeId)
        .single();

      if (!challenge) return;

      // Get all participants
      const { data: participants } = await supabase
        .from('nutrition_challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('total_meals', challenge.min_meals_required);

      if (!participants || participants.length === 0) return;

      // Sort by target metric
      const sortedParticipants = [...participants].sort((a, b) => {
        switch (challenge.target_metric) {
          case 'avg_grade':
            return b.average_grade_score - a.average_grade_score;
          case 'meal_count':
            return b.meals_above_target - a.meals_above_target;
          case 'total_score':
            return b.total_health_score - a.total_health_score;
          default:
            return 0;
        }
      });

      // Update ranks
      for (let i = 0; i < sortedParticipants.length; i++) {
        await supabase
          .from('nutrition_challenge_participants')
          .update({ rank: i + 1 })
          .eq('id', sortedParticipants[i].id);
      }
    } catch (error) {
      console.error('Error calculating rankings:', error);
    }
  }
}

export const nutritionChallengeService = new NutritionChallengeService();
