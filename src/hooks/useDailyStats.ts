import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHealthKit } from './useHealthKit';
import { useNutrition } from './useNutrition';
import { CalorieCalculationService } from '@/services/calorieCalculationService';

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
  weight_kg?: number;
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
        setUserProfile(data);
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
        // Get today's workout logs
        const { data: workoutLogs } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('started_at', new Date().toISOString().split('T')[0]) // Today
          .order('created_at', { ascending: false });

        // Get today's smart pin data for more detailed workout info
        const { data: smartPinData } = await supabase
          .from('smart_pin_data')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', new Date().toISOString().split('T')[0]) // Today
          .order('created_at', { ascending: false });

        // Calculate workout-based stats
        let totalDuration = 0;
        let totalExercises = 0;
        let totalHeartRate = 0;
        let heartRateCount = 0;
        const workouts: any[] = [];

        if (workoutLogs) {
          workoutLogs.forEach(workout => {
            totalDuration += workout.duration_minutes || 0;
            totalExercises += workout.completed_exercises || 0;
            
            workouts.push({
              duration_minutes: workout.duration_minutes || 30,
              muscle_group: workout.muscle_group,
              total_reps: workout.total_reps || 0,
              completed_exercises: workout.completed_exercises || 0
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

        // Calculate calories burned
        const caloriesBurned = CalorieCalculationService.calculateTotalDailyCalories(
          workouts,
          steps,
          userProfile
        );

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
  }, [userId, userProfile, healthMetrics, dailySummary]);

  // Set up real-time subscriptions for workout logs
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
          // Refetch data when workout logs change
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
          // Refetch data when smart pin data changes
          setStats(prev => ({ ...prev, loading: true }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workoutChannel);
      supabase.removeChannel(smartPinChannel);
    };
  }, [userId]);

  return stats;
};