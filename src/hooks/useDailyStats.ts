import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHealthKit } from './useHealthKit';
import { useNutrition } from './useNutrition';
import { CalorieCalculationService } from '@/services/calorieCalculationService';
import { getLocalDateString } from '@/utils/dateUtils';

interface DailyStats {
  caloriesBurned: number;
  caloriesConsumed: number;
  steps: number;
  workoutDuration: number;
  exercisesCompleted: number;
  avgHeartRate: number;
  loading: boolean;
}

interface UserProfile {
  weight_lbs?: number;
  age?: number;
  gender?: string;
  height_cm?: number;
}

export const useDailyStats = (userId?: string): DailyStats => {
  const [stats, setStats] = useState<DailyStats>({
    caloriesBurned: 0,
    caloriesConsumed: 0,
    steps: 0,
    workoutDuration: 0,
    exercisesCompleted: 0,
    avgHeartRate: 0,
    loading: true
  });

  const { healthMetrics } = useHealthKit();
  const { dailySummary } = useNutrition();

  // Fetch user profile for calorie calculations
  const [userProfile, setUserProfile] = useState<UserProfile>({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('profiles')
        .select('weight_kg, age, gender, height_cm')
        .eq('id', userId)
        .single();

      if (data) {
        // Convert weight from kg (stored in DB) to lbs (used in interface)
        setUserProfile({
          ...data,
          weight_lbs: data.weight_kg ? data.weight_kg * 2.2 : undefined
        });
      }
    };

    fetchUserProfile();
  }, [userId]);

  // Fetch daily workout and step data
  useEffect(() => {
    const fetchDailyData = async () => {
      if (!userId) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const today = getLocalDateString();
        
        // Get today's workout logs and cardio sessions in parallel
        // Include both completed and in-progress workouts
        const [
          { data: workoutLogs },
          { data: smartPinData },
          { data: runSessions },
          { data: rideSessions },
          { data: swimSessions },
          { data: exerciseLogs }
        ] = await Promise.all([
          supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('started_at', today)
            .order('created_at', { ascending: false }),
          
          supabase
            .from('smart_pin_data')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', today)
            .order('created_at', { ascending: false }),
          
          supabase
            .from('run_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('started_at', today),
          
          supabase
            .from('ride_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('started_at', today),
          
          supabase
            .from('swim_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('started_at', today),
          
          supabase
            .from('exercise_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', today)
        ]);

        // Calculate workout-based stats from exercise_logs
        let totalDuration = 0;
        let totalExercises = 0;
        let totalHeartRate = 0;
        let heartRateCount = 0;
        const workouts: any[] = [];

        // Count actual exercises completed
        totalExercises = exerciseLogs?.length || 0;

        if (workoutLogs) {
          workoutLogs.forEach(workout => {
            // Get exercises for THIS specific workout
            const workoutExercises = exerciseLogs?.filter(
              (ex: any) => ex.workout_log_id === workout.id
            ) || [];
            
            // Skip workouts with no exercises (empty workout sessions)
            if (workoutExercises.length === 0) {
              return;
            }
            
            // Use actual duration if completed, otherwise calculate from exercise timestamps
            if (workout.completed_at) {
              totalDuration += workout.duration_minutes || 0;
            } else if (workoutExercises.length > 0) {
              // Calculate duration from exercise timestamps for in-progress workouts
              const firstExercise = new Date(workoutExercises[0].created_at).getTime();
              const lastExercise = new Date(workoutExercises[workoutExercises.length - 1].created_at).getTime();
              totalDuration += Math.round((lastExercise - firstExercise) / 60000);
            }
            
            workouts.push({
              duration_minutes: workout.duration_minutes || 30,
              muscle_group: workout.muscle_group,
              total_reps: workout.total_reps || 0,
              completed_exercises: workoutExercises.length // Use count for THIS workout only
            });
          });
        }

        if (smartPinData) {
          smartPinData.forEach(data => {
            if (data.heart_rate) {
              totalHeartRate += data.heart_rate;
              heartRateCount++;
            }
          });
        }

        // Get steps from Apple Watch (if available)
        const steps = healthMetrics.steps || 0;

        // Calculate cardio calories
        const cardioCalories = (runSessions || []).reduce((sum, run) => sum + run.calories, 0) +
                               (rideSessions || []).reduce((sum, ride) => sum + ride.calories, 0) +
                               (swimSessions || []).reduce((sum, swim) => sum + swim.calories, 0);

        // Calculate workout calories
        const workoutCalories = CalorieCalculationService.calculateTotalDailyCalories(
          workouts,
          steps,
          userProfile
        );

        // Total calories burned
        const caloriesBurned = workoutCalories + cardioCalories;

        // Get calories consumed from nutrition data
        const caloriesConsumed = dailySummary?.total_calories || 0;

        // Calculate average heart rate
        const avgHeartRate = heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 
                           (healthMetrics.heartRate || 0);

        setStats({
          caloriesBurned,
          caloriesConsumed,
          steps,
          workoutDuration: totalDuration,
          exercisesCompleted: totalExercises,
          avgHeartRate,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching daily stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDailyData();
  }, [userId, userProfile, healthMetrics]);

  // Immediate update for calories consumed when dailySummary changes
  useEffect(() => {
    if (dailySummary?.total_calories !== undefined) {
      setStats(prev => ({
        ...prev,
        caloriesConsumed: dailySummary.total_calories
      }));
    }
  }, [dailySummary?.total_calories]);

  // Listen for nutrition:updated custom events
  useEffect(() => {
    const handleNutritionUpdate = () => {
      console.log('useDailyStats: nutrition:updated event received');
      setStats(prev => ({ ...prev, loading: true }));
    };

    window.addEventListener('nutrition:updated', handleNutritionUpdate);
    return () => window.removeEventListener('nutrition:updated', handleNutritionUpdate);
  }, []);

  // Set up real-time subscriptions for workout logs and food entries
  useEffect(() => {
    if (!userId) return;

    const workoutChannel = supabase
      .channel('workout_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
          filter: `user_id=eq.${userId}`
        },
        () => {
          setStats(prev => ({ ...prev, loading: true }));
        }
      )
      .subscribe();

    const smartPinChannel = supabase
      .channel('smart_pin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'smart_pin_data',
          filter: `user_id=eq.${userId}`
        },
        () => {
          setStats(prev => ({ ...prev, loading: true }));
        }
      )
      .subscribe();

    const exerciseLogsChannel = supabase
      .channel('exercise_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_logs',
          filter: `user_id=eq.${userId}`
        },
        () => {
          setStats(prev => ({ ...prev, loading: true }));
        }
      )
      .subscribe();

    const foodEntriesChannel = supabase
      .channel('food_entries_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_entries',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('useDailyStats: food_entries changed');
          setStats(prev => ({ ...prev, loading: true }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workoutChannel);
      supabase.removeChannel(smartPinChannel);
      supabase.removeChannel(exerciseLogsChannel);
      supabase.removeChannel(foodEntriesChannel);
    };
  }, [userId]);

  return stats;
};