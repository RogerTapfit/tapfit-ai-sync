import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutStreak {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  streakStartDate: string | null;
  totalWorkoutDays: number;
  milestonesAchieved: Record<string, boolean>;
}

interface StreakMilestone {
  id: string;
  milestoneDays: number;
  achievedAt: string;
  coinsAwarded: number;
  streakCount: number;
}

interface StreakUpdateResult {
  currentStreak: number;
  milestoneReached: number;
  coinsAwarded: number;
  isNewStreak: boolean;
}

export const useWorkoutStreak = () => {
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
    fetchMilestones();
  }, []);

  const fetchStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStreak({
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastWorkoutDate: data.last_workout_date,
          streakStartDate: data.streak_start_date,
          totalWorkoutDays: data.total_workout_days,
          milestonesAchieved: (data.milestones_achieved as Record<string, boolean>) || {}
        });
      } else {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastWorkoutDate: null,
          streakStartDate: null,
          totalWorkoutDays: 0,
          milestonesAchieved: {}
        });
      }
    } catch (err) {
      console.error('Error fetching workout streak:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('streak_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (error) throw error;

      setMilestones(
        data?.map(m => ({
          id: m.id,
          milestoneDays: m.milestone_days,
          achievedAt: m.achieved_at,
          coinsAwarded: m.coins_awarded,
          streakCount: m.streak_count
        })) || []
      );
    } catch (err) {
      console.error('Error fetching streak milestones:', err);
    }
  };

  const updateStreak = async (workoutDate?: Date): Promise<StreakUpdateResult | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const dateToUse = workoutDate || new Date();
      const dateString = dateToUse.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('update_workout_streak', {
        _user_id: user.id,
        _workout_date: dateString
      });

      if (error) throw error;

      // Refresh streak data
      await fetchStreak();
      await fetchMilestones();

      const result = data as any;
      return {
        currentStreak: result.current_streak,
        milestoneReached: result.milestone_reached,
        coinsAwarded: result.coins_awarded,
        isNewStreak: result.is_new_streak
      };
    } catch (err) {
      console.error('Error updating workout streak:', err);
      return null;
    }
  };

  const getNextMilestone = () => {
    if (!streak) return null;
    
    const milestoneTargets = [7, 14, 30, 60, 100];
    const current = streak.currentStreak;
    
    for (const target of milestoneTargets) {
      if (current < target) {
        return {
          target,
          daysRemaining: target - current,
          progress: (current / target) * 100
        };
      }
    }
    
    return null;
  };

  const isStreakActive = () => {
    if (!streak?.lastWorkoutDate) return false;
    
    const lastWorkout = new Date(streak.lastWorkoutDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
    
    // Streak is active if last workout was today or yesterday
    return diffDays <= 1;
  };

  return {
    streak,
    milestones,
    loading,
    updateStreak,
    getNextMilestone,
    isStreakActive,
    refetch: fetchStreak
  };
};
