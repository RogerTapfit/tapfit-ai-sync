import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutSession {
  id: string;
  completed_at: string;
  duration_minutes: number;
  calories_burned: number;
  muscle_group: string;
  exercises: {
    exercise_name: string;
    machine_name: string;
    sets_completed: number;
    reps_completed: number;
    weight_used: number;
    total_volume: number;
  }[];
}

interface ExerciseProgression {
  date: string;
  weight: number;
  reps: number;
  sets: number;
  volume: number;
}

export const useWorkoutComparison = (muscleGroup?: string, exerciseName?: string) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progression, setProgression] = useState<ExerciseProgression[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch exercises first (primary data source)
        let exerciseQuery = supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(100);

        if (exerciseName) {
          exerciseQuery = exerciseQuery.eq('exercise_name', exerciseName);
        }

        const { data: exercises, error: exerciseError } = await exerciseQuery;

        if (exerciseError) throw exerciseError;

        if (!exercises || exercises.length === 0) {
          setSessions([]);
          setProgression([]);
          setLoading(false);
          return;
        }

        // Group exercises by workout_log_id
        const workoutMap = new Map<string, typeof exercises>();
        exercises.forEach(ex => {
          if (!workoutMap.has(ex.workout_log_id)) {
            workoutMap.set(ex.workout_log_id, []);
          }
          workoutMap.get(ex.workout_log_id)!.push(ex);
        });

        // Fetch workout logs for these exercises
        const workoutIds = Array.from(workoutMap.keys());
        const { data: workouts } = await supabase
          .from('workout_logs')
          .select('id, completed_at, duration_minutes, calories_burned')
          .in('id', workoutIds);

        // Build sessions data
        const sessionsData: WorkoutSession[] = [];
        workoutMap.forEach((workoutExercises, workoutId) => {
          const workout = workouts?.find(w => w.id === workoutId);
          if (!workout) return;

          // Determine muscle group from exercises
          const muscleGroups = workoutExercises.map(e => {
            const name = e.machine_name || e.exercise_name || '';
            if (name.toLowerCase().includes('leg') || name.toLowerCase().includes('squat')) return 'legs';
            if (name.toLowerCase().includes('chest') || name.toLowerCase().includes('press')) return 'chest';
            if (name.toLowerCase().includes('back') || name.toLowerCase().includes('row') || name.toLowerCase().includes('pull')) return 'back';
            if (name.toLowerCase().includes('shoulder') || name.toLowerCase().includes('delt')) return 'shoulders';
            if (name.toLowerCase().includes('arm') || name.toLowerCase().includes('bicep') || name.toLowerCase().includes('tricep')) return 'arms';
            if (name.toLowerCase().includes('core') || name.toLowerCase().includes('ab')) return 'core';
            return 'other';
          });
          const primaryMuscleGroup = muscleGroups[0] || 'other';

          // Skip if filtering by muscle group and doesn't match
          if (muscleGroup && primaryMuscleGroup !== muscleGroup.toLowerCase()) return;

          sessionsData.push({
            id: workoutId,
            completed_at: workout.completed_at || workoutExercises[0].completed_at,
            duration_minutes: workout.duration_minutes || 0,
            calories_burned: workout.calories_burned || 0,
            muscle_group: primaryMuscleGroup,
            exercises: workoutExercises.map(e => ({
              exercise_name: e.exercise_name,
              machine_name: e.machine_name,
              sets_completed: e.sets_completed || 0,
              reps_completed: e.reps_completed || 0,
              weight_used: e.weight_used || 0,
              total_volume: (e.weight_used || 0) * (e.reps_completed || 0) * (e.sets_completed || 0)
            }))
          });
        });

        // Sort by date and limit to 20
        sessionsData.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
        setSessions(sessionsData.slice(0, 20));

        // Calculate progression data for specific exercise
        if (exerciseName && exercises) {
          const progressionData = exercises
            .filter(e => e.exercise_name === exerciseName)
            .map(e => ({
              date: e.completed_at,
              weight: e.weight_used || 0,
              reps: e.reps_completed || 0,
              sets: e.sets_completed || 0,
              volume: (e.weight_used || 0) * (e.reps_completed || 0) * (e.sets_completed || 0)
            }))
            .reverse(); // Oldest to newest for chart

          setProgression(progressionData);
        }

      } catch (error) {
        console.error('Error fetching workout comparison data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (muscleGroup || exerciseName) {
      fetchHistoricalData();
    } else {
      setLoading(false);
    }
  }, [muscleGroup, exerciseName]);

  return { sessions, progression, loading };
};
