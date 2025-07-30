import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecentWorkout {
  date: string;
  type: string;
  duration: number;
  calories: number;
  change?: string;
}

export const useRecentWorkouts = (userId?: string) => {
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateCalories = (muscleGroup: string, durationMinutes: number, avgWeight: number = 0) => {
    // Basic calorie calculation based on muscle group and duration
    const baseCaloriesPerMinute: Record<string, number> = {
      'chest': 8,
      'back': 7,
      'legs': 10,
      'shoulders': 6,
      'arms': 5,
      'core': 4,
      'cardio': 12
    };
    
    const rate = baseCaloriesPerMinute[muscleGroup.toLowerCase()] || 6;
    const weightMultiplier = avgWeight > 100 ? 1.2 : 1.0;
    return Math.round(rate * durationMinutes * weightMultiplier);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const fetchRecentWorkouts = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Get recent workout logs with exercise data
      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select(`
          *,
          exercise_logs (
            exercise_name,
            reps_completed,
            weight_used
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedWorkouts: RecentWorkout[] = workoutLogs?.map(workout => {
        const avgWeight = workout.exercise_logs?.length > 0 
          ? workout.exercise_logs.reduce((sum, ex) => sum + (ex.weight_used || 0), 0) / workout.exercise_logs.length
          : 0;
        
        const duration = workout.duration_minutes || 30; // fallback to 30 min if null
        const calories = workout.calories_burned || calculateCalories(workout.muscle_group, duration, avgWeight);
        
        // Format muscle group for display
        const muscleGroupMap: Record<string, string> = {
          'chest': 'Upper Body',
          'back': 'Upper Body', 
          'shoulders': 'Upper Body',
          'arms': 'Upper Body',
          'legs': 'Lower Body',
          'core': 'Core',
          'cardio': 'Cardio'
        };

        return {
          date: formatDate(new Date(workout.started_at)),
          type: muscleGroupMap[workout.muscle_group.toLowerCase()] || workout.muscle_group,
          duration,
          calories,
          change: workout.completed_exercises > 0 ? '+12% vs avg' : undefined
        };
      }) || [];

      setRecentWorkouts(formattedWorkouts);
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
      setRecentWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentWorkouts();
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('recent-workouts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchRecentWorkouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { recentWorkouts, loading, refetch: fetchRecentWorkouts };
};