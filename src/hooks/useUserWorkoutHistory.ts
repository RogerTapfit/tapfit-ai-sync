import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutHistoryItem {
  id: string;
  type: 'strength' | 'cardio';
  date: Date;
  duration: number;
  caloriesBurned: number;
  muscleGroup: string;
  exercisesCompleted: number;
}

export const useUserWorkoutHistory = (userId?: string) => {
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch workout logs
        const { data: workoutLogs, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const formattedWorkouts: WorkoutHistoryItem[] = (workoutLogs || []).map((w: any) => ({
          id: w.id,
          type: w.muscle_group?.toLowerCase() === 'cardio' ? 'cardio' : 'strength',
          date: new Date(w.completed_at || w.started_at),
          duration: w.duration_minutes || 0,
          caloriesBurned: w.calories_burned || 0,
          muscleGroup: w.muscle_group || 'General',
          exercisesCompleted: w.exercises_completed || w.completed_exercises || 0,
        }));

        setWorkouts(formattedWorkouts);
      } catch (error) {
        console.error('Error fetching user workout history:', error);
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [userId]);

  return { workouts, loading };
};
