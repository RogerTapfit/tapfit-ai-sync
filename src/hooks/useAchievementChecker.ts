import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { useGamerAchievements } from './useGamerAchievements';
import { toast } from 'sonner';

interface UserStats {
  total_workouts: number;
  total_meals: number;
  total_water_logs: number;
  workout_streak: number;
  hydration_streak: number;
  unique_machines: number;
  total_reps: number;
}

export const useAchievementChecker = () => {
  const { user } = useAuth();
  const { achievements, userAchievements, unlockAchievement } = useGamerAchievements();
  const checkingRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  // Fetch user stats from database
  const fetchUserStats = useCallback(async (): Promise<UserStats | null> => {
    if (!user?.id) return null;

    try {
      // Parallel queries for all stats
      const [
        workoutsResult,
        mealsResult,
        waterResult,
        workoutStreakResult,
        hydrationStreakResult,
        exerciseLogsResult
      ] = await Promise.all([
        // Total completed workouts
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('completed_at', 'is', null),
        
        // Total meals logged
        supabase
          .from('food_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Total water logs
        supabase
          .from('water_intake')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Workout streak
        supabase
          .from('workout_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // Hydration streak
        supabase
          .from('hydration_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // Unique machines & total reps
        supabase
          .from('exercise_logs')
          .select('machine_name, reps_completed')
          .eq('user_id', user.id)
      ]);

      const uniqueMachines = new Set(
        exerciseLogsResult.data?.map(e => e.machine_name).filter(Boolean) || []
      ).size;

      const totalReps = exerciseLogsResult.data?.reduce(
        (sum, e) => sum + (e.reps_completed || 0), 0
      ) || 0;

      return {
        total_workouts: workoutsResult.count || 0,
        total_meals: mealsResult.count || 0,
        total_water_logs: waterResult.count || 0,
        workout_streak: workoutStreakResult.data?.current_streak || 0,
        hydration_streak: hydrationStreakResult.data?.current_streak || 0,
        unique_machines: uniqueMachines,
        total_reps: totalReps,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }, [user?.id]);

  // Check and unlock achievements based on stats
  const checkAchievements = useCallback(async () => {
    if (!user?.id || checkingRef.current) return;
    
    // Debounce - don't check more than once per 10 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 10000) return;
    lastCheckRef.current = now;
    
    checkingRef.current = true;

    try {
      const stats = await fetchUserStats();
      if (!stats) {
        checkingRef.current = false;
        return;
      }

      console.log('🏆 Checking achievements with stats:', stats);

      const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
      
      for (const achievement of achievements) {
        // Skip if already unlocked
        if (unlockedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        // Check based on trigger_type and trigger_value
        switch (achievement.trigger_type) {
          case 'workout_count':
            shouldUnlock = stats.total_workouts >= achievement.trigger_value;
            break;
          case 'meal_count':
            shouldUnlock = stats.total_meals >= achievement.trigger_value;
            break;
          case 'water_log_count':
            shouldUnlock = stats.total_water_logs >= achievement.trigger_value;
            break;
          case 'workout_streak':
            shouldUnlock = stats.workout_streak >= achievement.trigger_value;
            break;
          case 'hydration_streak':
            shouldUnlock = stats.hydration_streak >= achievement.trigger_value;
            break;
          case 'unique_machines':
            shouldUnlock = stats.unique_machines >= achievement.trigger_value;
            break;
          case 'total_reps':
            shouldUnlock = stats.total_reps >= achievement.trigger_value;
            break;
        }

        if (shouldUnlock) {
          console.log('🔓 Unlocking achievement:', achievement.name);
          const result = await unlockAchievement(achievement.id);
          
          if (result) {
            // Show achievement unlock toast
            toast.success(
              `🏆 Achievement Unlocked: ${achievement.badge_emoji} ${achievement.name}`,
              {
                description: `+${achievement.xp_reward} XP, +${achievement.coin_reward} Coins`,
                duration: 5000,
              }
            );
            
            // Dispatch event for XP gain
            window.dispatchEvent(new CustomEvent('xpAwarded', {
              detail: {
                amount: achievement.xp_reward,
                source: 'achievement'
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    } finally {
      checkingRef.current = false;
    }
  }, [user?.id, achievements, userAchievements, unlockAchievement, fetchUserStats]);

  // Trigger check on specific events
  const triggerCheck = useCallback(() => {
    // Small delay to allow database updates to propagate
    setTimeout(() => {
      checkAchievements();
    }, 500);
  }, [checkAchievements]);

  return {
    checkAchievements,
    triggerCheck,
    fetchUserStats,
  };
};
