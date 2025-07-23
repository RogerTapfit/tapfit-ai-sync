import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useTapCoins } from './useTapCoins';

interface WorkoutProgress {
  total_exercises: number;
  completed_exercises: number;
  completion_percentage: number;
}

interface WorkoutLog {
  id: string;
  workout_name: string;
  muscle_group: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  total_exercises: number;
  completed_exercises: number;
  total_reps: number;
  calories_burned?: number;
  notes?: string;
}

interface ExerciseLog {
  id: string;
  exercise_name: string;
  machine_name?: string;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number;
  completed_at: string;
  notes?: string;
}

export const useWorkoutLogger = () => {
  const [currentWorkoutLog, setCurrentWorkoutLog] = useState<WorkoutLog | null>(null);
  const [todaysProgress, setTodaysProgress] = useState<WorkoutProgress>({
    total_exercises: 0,
    completed_exercises: 0,
    completion_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { awardCoins } = useTapCoins();

  // Fetch today's workout progress
  const fetchTodaysProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc('get_todays_workout_progress', {
      _user_id: user.id
    });

    if (error) {
      console.error('Error fetching workout progress:', error);
      return;
    }

    if (data && data.length > 0) {
      setTodaysProgress(data[0]);
    }
  };

  // Start a new workout session
  const startWorkout = async (workoutName: string, muscleGroup: string, totalExercises: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_name: workoutName,
          muscle_group: muscleGroup,
          total_exercises: totalExercises,
          completed_exercises: 0,
          total_reps: 0
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentWorkoutLog(data);
      await fetchTodaysProgress();
      
      toast({
        title: "Workout Started! 💪",
        description: `${workoutName} session has begun.`,
      });

      return data;
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({
        title: "Error",
        description: "Failed to start workout session.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Log an exercise completion
  const logExercise = async (
    workoutLogId: string,
    exerciseName: string,
    machineName?: string,
    sets: number = 1,
    reps: number = 10,
    weight?: number
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      // Insert exercise log
      const { error: exerciseError } = await supabase
        .from('exercise_logs')
        .insert({
          user_id: user.id,
          workout_log_id: workoutLogId,
          exercise_name: exerciseName,
          machine_name: machineName,
          sets_completed: sets,
          reps_completed: reps,
          weight_used: weight
        });

      if (exerciseError) throw exerciseError;

      // Update workout log with new completion count and reps
      const { data: currentLog, error: fetchError } = await supabase
        .from('workout_logs')
        .select('completed_exercises, total_reps')
        .eq('id', workoutLogId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('workout_logs')
        .update({
          completed_exercises: currentLog.completed_exercises + 1,
          total_reps: currentLog.total_reps + reps
        })
        .eq('id', workoutLogId);

      if (updateError) throw updateError;

      // Award coins for completing exercise (100 reps = 1 tap coin)
      const coinAmount = Math.floor(reps / 100);
      if (coinAmount > 0) {
        await awardCoins(coinAmount, 'earn_workout', `Completed ${exerciseName}: ${reps} reps`);
      }

      await fetchTodaysProgress();
      
      toast({
        title: "Exercise Completed! 🎯",
        description: `${exerciseName} - ${sets} sets × ${reps} reps${coinAmount > 0 ? ` (+${coinAmount} coins)` : ''}`,
      });

      return true;
    } catch (error) {
      console.error('Error logging exercise:', error);
      toast({
        title: "Error",
        description: "Failed to log exercise completion.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Complete the entire workout
  const completeWorkout = async (workoutLogId: string, duration?: number, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('workout_logs')
        .update({
          completed_at: new Date().toISOString(),
          duration_minutes: duration,
          notes: notes
        })
        .eq('id', workoutLogId);

      if (error) throw error;

      await fetchTodaysProgress();
      setCurrentWorkoutLog(null);

      toast({
        title: "Workout Completed! 🎉",
        description: "Great job finishing your workout session!",
      });

      return true;
    } catch (error) {
      console.error('Error completing workout:', error);
      toast({
        title: "Error",
        description: "Failed to complete workout.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get today's completed exercises by name (for checking if an exercise is completed)
  const getTodaysCompletedExercises = async (): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('exercise_logs')
      .select('exercise_name')
      .eq('user_id', user.id)
      .gte('completed_at', new Date().toISOString().split('T')[0]) // Today's date
      .lt('completed_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Tomorrow's date

    if (error) {
      console.error('Error fetching completed exercises:', error);
      return [];
    }

    return data?.map(log => log.exercise_name) || [];
  };

  useEffect(() => {
    fetchTodaysProgress();
  }, []);

  return {
    currentWorkoutLog,
    todaysProgress,
    loading,
    startWorkout,
    logExercise,
    completeWorkout,
    getTodaysCompletedExercises,
    refreshProgress: fetchTodaysProgress
  };
};