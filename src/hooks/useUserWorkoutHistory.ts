import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SetDetail {
  set_number: number;
  reps_completed: number;
  weight_used: number;
  rest_duration_seconds: number | null;
  perceived_effort: number | null;
  completed_at: string;
}

interface ExerciseDetail {
  exercise_name: string;
  machine_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number;
  sets: SetDetail[];
  total_volume: number;
  avg_rpe: number | null;
  is_pr: boolean;
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
  totalVolume: number;
  avgPowerLevel: number | null;
  totalSets: number;
  totalReps: number;
  prCount: number;
  totalRestTime: number;
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

        // Fetch workout logs with exercise details and sets
        const { data: workoutLogs, error } = await supabase
          .from('workout_logs')
          .select(`
            *,
            exercise_logs (
              id,
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

        // Fetch personal records for PR indicators
        const { data: personalRecords } = await supabase
          .from('personal_records')
          .select('exercise_name, machine_name, achieved_at')
          .eq('user_id', userId)
          .order('achieved_at', { ascending: false });


        // Filter out abandoned workouts with 0 exercises
        const filteredWorkouts = (workoutLogs || []).filter((w: any) => {
          // Keep completed workouts
          if (w.completed_at) return true;
          
          // Keep abandoned workouts that have at least one exercise logged
          return w.exercise_logs && w.exercise_logs.length > 0;
        });

        // Create a map of PRs for quick lookup
        const prMap = new Map<string, Date>();
        (personalRecords || []).forEach((pr: any) => {
          const key = `${pr.exercise_name}-${pr.machine_name}`;
          prMap.set(key, new Date(pr.achieved_at));
        });

        const formattedWorkouts: WorkoutHistoryItem[] = filteredWorkouts.map((w: any) => {
          const workoutDate = new Date(w.completed_at || w.started_at);
          let totalVolume = 0;
          let totalSets = 0;
          let totalReps = 0;
          let totalRpeSum = 0;
          let rpeCount = 0;
          let totalRestTime = 0;
          let prCount = 0;

          const exercises: ExerciseDetail[] = (w.exercise_logs || []).map((ex: any) => {
            const sets: SetDetail[] = (ex.exercise_sets || [])
              .sort((a: any, b: any) => a.set_number - b.set_number)
              .map((set: any) => {
                const volume = (set.reps_completed || 0) * (set.weight_used || 0);
                totalVolume += volume;
                totalSets++;
                totalReps += set.reps_completed || 0;
                
                if (set.perceived_effort) {
                  totalRpeSum += set.perceived_effort;
                  rpeCount++;
                }
                
                if (set.rest_duration_seconds) {
                  totalRestTime += set.rest_duration_seconds;
                }

                return {
                  set_number: set.set_number,
                  reps_completed: set.reps_completed || 0,
                  weight_used: set.weight_used || 0,
                  rest_duration_seconds: set.rest_duration_seconds,
                  perceived_effort: set.perceived_effort,
                  completed_at: set.completed_at,
                };
              });

            // Calculate exercise-specific metrics
            const exerciseVolume = sets.reduce((sum, set) => 
              sum + (set.reps_completed * set.weight_used), 0
            );
            
            const rpes = sets.filter(s => s.perceived_effort).map(s => s.perceived_effort!);
            const avgRpe = rpes.length > 0 
              ? rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length 
              : null;

            // Check if this exercise was a PR on this workout date
            const prKey = `${ex.exercise_name}-${ex.machine_name}`;
            const prDate = prMap.get(prKey);
            const isPr = prDate ? Math.abs(prDate.getTime() - workoutDate.getTime()) < 60000 : false;
            if (isPr) prCount++;

            return {
              exercise_name: ex.exercise_name || 'Unknown Exercise',
              machine_name: ex.machine_name || 'Unknown Machine',
              sets_completed: ex.sets_completed || sets.length,
              reps_completed: ex.reps_completed || 0,
              weight_used: ex.weight_used || 0,
              sets,
              total_volume: exerciseVolume,
              avg_rpe: avgRpe,
              is_pr: isPr,
            };
          });

          return {
            id: w.id,
            type: w.muscle_group?.toLowerCase() === 'cardio' ? 'cardio' : 'strength',
            date: workoutDate,
            duration: w.duration_minutes || 0,
            caloriesBurned: w.calories_burned || 0,
            muscleGroup: w.muscle_group || 'General',
            exercisesCompleted: w.exercises_completed || w.completed_exercises || 0,
            exercises,
            isCompleted: !!w.completed_at,
            totalVolume,
            avgPowerLevel: rpeCount > 0 ? totalRpeSum / rpeCount : null,
            totalSets,
            totalReps,
            prCount,
            totalRestTime,
          };
        });

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
