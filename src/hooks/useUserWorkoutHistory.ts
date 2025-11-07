import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseDetail {
  exercise_name: string;
  machine_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number;
}

interface WorkoutHistoryItem {
  id: string;
  type: 'strength' | 'cardio';
  date: Date;
  duration: number;
  caloriesBurned: number;
  muscleGroup: string;
  exercisesCompleted: number;
  exercises: ExerciseDetail[];
  isCompleted: boolean;
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

        // Fetch workout logs with exercise details
        const { data: workoutLogs, error } = await supabase
          .from('workout_logs')
          .select(`
            *,
            exercise_logs (
              exercise_name,
              machine_name,
              sets_completed,
              reps_completed,
              weight_used
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Filter out abandoned workouts with 0 exercises
        const filteredWorkouts = (workoutLogs || []).filter((w: any) => {
          // Keep completed workouts
          if (w.completed_at) return true;
          
          // Keep abandoned workouts that have at least one exercise logged
          return w.exercise_logs && w.exercise_logs.length > 0;
        });

        const formattedWorkouts: WorkoutHistoryItem[] = filteredWorkouts.map((w: any) => ({
          id: w.id,
          type: w.muscle_group?.toLowerCase() === 'cardio' ? 'cardio' : 'strength',
          date: new Date(w.completed_at || w.started_at),
          duration: w.duration_minutes || 0,
          caloriesBurned: w.calories_burned || 0,
          muscleGroup: w.muscle_group || 'General',
          exercisesCompleted: w.exercises_completed || w.completed_exercises || 0,
          exercises: (w.exercise_logs || []).map((ex: any) => ({
            exercise_name: ex.exercise_name || 'Unknown Exercise',
            machine_name: ex.machine_name || 'Unknown Machine',
            sets_completed: ex.sets_completed || 0,
            reps_completed: ex.reps_completed || 0,
            weight_used: ex.weight_used || 0,
          })),
          isCompleted: !!w.completed_at,
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
