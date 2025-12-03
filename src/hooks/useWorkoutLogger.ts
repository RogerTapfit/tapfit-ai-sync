
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useTapCoins } from './useTapCoins';
import { isGuestMode } from '@/lib/utils';
import { getLocalDateString, getLocalTomorrowString } from '@/utils/dateUtils';

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

  // Persist workout log ID to survive page navigation
  const saveWorkoutLogId = (workoutLogId: string) => {
    sessionStorage.setItem('currentWorkoutLogId', workoutLogId);
  };

  const getWorkoutLogId = (): string | null => {
    return sessionStorage.getItem('currentWorkoutLogId');
  };

  const clearWorkoutLogId = () => {
    sessionStorage.removeItem('currentWorkoutLogId');
  };

  // Load existing workout log from storage
  const loadExistingWorkoutLog = async () => {
    const storedLogId = getWorkoutLogId();
    if (!storedLogId) return null;

    console.log("Loading existing workout log:", storedLogId);
    
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('id', storedLogId)
        .single();

      if (error) {
        console.error('Error loading existing workout log:', error);
        clearWorkoutLogId();
        return null;
      }

      if (data && !data.completed_at) {
        console.log("Found active workout log:", data);
        setCurrentWorkoutLog(data);
        return data;
      } else {
        console.log("Workout log is completed, clearing storage");
        clearWorkoutLogId();
        return null;
      }
    } catch (error) {
      console.error('Error loading workout log:', error);
      clearWorkoutLogId();
      return null;
    }
  };

  // Get today's active workout log
  const getTodaysActiveWorkoutLog = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    console.log("Checking for today's active workout log");
    
    const today = getLocalDateString();
    const tomorrow = getLocalTomorrowString();
    
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', today)
      .lt('started_at', tomorrow)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active workout log:', error);
      return null;
    }

    if (data && data.length > 0) {
      console.log("Found today's active workout log:", data[0]);
      setCurrentWorkoutLog(data[0]);
      saveWorkoutLogId(data[0].id);
      return data[0];
    }

    return null;
  };

  // Fetch today's workout progress
  const fetchTodaysProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log("Fetching today's workout progress");
    
    const { data, error } = await supabase.rpc('get_todays_workout_progress', {
      _user_id: user.id
    });

    if (error) {
      console.error('Error fetching workout progress:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log("Updated progress:", data[0]);
      setTodaysProgress(data[0]);
    }
  };

  // Start a new workout session
  const startWorkout = async (workoutName: string, muscleGroup: string, totalExercises: number) => {
    if (isGuestMode()) {
      toast({ title: 'Guest Mode', description: 'Workouts aren’t saved. Create an account to track sessions.', variant: 'destructive' });
      return null;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if there's already an active workout log
    const existingLog = await getTodaysActiveWorkoutLog();
    if (existingLog) {
      console.log("Using existing workout log instead of creating new one");
      return existingLog;
    }

    setLoading(true);
    
    try {
      console.log("Creating new workout log");
      
      // Double check for existing log right before creation to prevent race condition
      const doubleCheckLog = await getTodaysActiveWorkoutLog();
      if (doubleCheckLog) {
        console.log("Found existing log during double check");
        setLoading(false);
        return doubleCheckLog;
      }
      
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

      if (error) {
        // If insertion fails due to constraint, try to get existing log
        console.log("Insert failed, checking for existing log:", error);
        const fallbackLog = await getTodaysActiveWorkoutLog();
        if (fallbackLog) {
          console.log("Found existing log after insert failure");
          setLoading(false);
          return fallbackLog;
        }
        throw error;
      }

      console.log("Created new workout log:", data);
      setCurrentWorkoutLog(data);
      saveWorkoutLogId(data.id);
      await fetchTodaysProgress();
      
      toast({
        title: "Workout Started! 💪",
        description: `${workoutName} session has begun.`,
      });

      return data;
    } catch (error) {
      console.error('Error starting workout:', error);
      
      // Final fallback - check for existing log one more time
      const fallbackLog = await getTodaysActiveWorkoutLog();
      if (fallbackLog) {
        console.log("Using fallback existing log");
        setLoading(false);
        return fallbackLog;
      }
      
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
    if (isGuestMode()) {
      toast({ title: 'Guest Mode', description: 'Exercises aren’t saved in guest mode.', variant: 'destructive' });
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found for logExercise');
      return false;
    }

    console.log("Logging exercise:", {
      workoutLogId,
      exerciseName,
      machineName,
      sets,
      reps,
      weight
    });

    try {
      // Insert exercise log
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercise_logs')
        .insert({
          user_id: user.id,
          workout_log_id: workoutLogId,
          exercise_name: exerciseName,
          machine_name: machineName,
          sets_completed: sets,
          reps_completed: reps,
          weight_used: weight
        })
        .select()
        .single();

      if (exerciseError) {
        console.error('Error inserting exercise log:', exerciseError);
        throw exerciseError;
      }

      console.log("Exercise log inserted:", exerciseData);

      // Update workout log with new completion count and reps
      const { data: currentLog, error: fetchError } = await supabase
        .from('workout_logs')
        .select('completed_exercises, total_reps')
        .eq('id', workoutLogId)
        .single();

      if (fetchError) {
        console.error('Error fetching current workout log:', fetchError);
        throw fetchError;
      }

      const newCompletedExercises = currentLog.completed_exercises + 1;
      const newTotalReps = currentLog.total_reps + reps;

      console.log("Updating workout log:", {
        completed_exercises: newCompletedExercises,
        total_reps: newTotalReps
      });

      const { error: updateError } = await supabase
        .from('workout_logs')
        .update({
          completed_exercises: newCompletedExercises,
          total_reps: newTotalReps
        })
        .eq('id', workoutLogId);

      if (updateError) {
        console.error('Error updating workout log:', updateError);
        throw updateError;
      }

      // Update local state
      setCurrentWorkoutLog(prev => prev ? {
        ...prev,
        completed_exercises: newCompletedExercises,
        total_reps: newTotalReps
      } : null);

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

      console.log("Exercise successfully logged and progress updated");
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
    if (isGuestMode()) {
      toast({ title: 'Guest Mode', description: 'Completion isn’t saved in guest mode.', variant: 'destructive' });
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      // Fetch all exercise logs for this workout to calculate calories
      const { data: exerciseLogs, error: exerciseError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('workout_log_id', workoutLogId);

      if (exerciseError) {
        console.error('Error fetching exercise logs:', exerciseError);
      }

      // Get workout log to determine muscle group
      const { data: workoutLog } = await supabase
        .from('workout_logs')
        .select('muscle_group')
        .eq('id', workoutLogId)
        .single();

      // Get user profile for calorie calculation
      let userProfile = {};
      const { data: profile } = await supabase
        .from('profiles')
        .select('weight_kg, age, gender, height_cm')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        userProfile = {
          ...profile,
          weight_lbs: profile.weight_kg ? profile.weight_kg * 2.2 : undefined
        };
      }

      // Calculate calories burned using CalorieCalculationService
      const { CalorieCalculationService } = await import('@/services/calorieCalculationService');
      const totalReps = exerciseLogs?.reduce((sum, log) => sum + (log.reps_completed || 0), 0) || 0;
      const completedExercises = exerciseLogs?.length || 0;
      
      const calories = CalorieCalculationService.calculateWorkoutCalories(
        {
          duration_minutes: duration || 30,
          muscle_group: workoutLog?.muscle_group || 'Full Body',
          total_reps: totalReps,
          completed_exercises: completedExercises
        },
        userProfile
      );

      console.log('Calculated calories for workout:', calories);

      const { error } = await supabase
        .from('workout_logs')
        .update({
          completed_at: new Date().toISOString(),
          duration_minutes: duration,
          calories_burned: calories,
          notes: notes
        })
        .eq('id', workoutLogId);

      if (error) throw error;

      // Update workout streak
      await supabase.rpc('update_workout_streak', {
        _user_id: user.id,
        _workout_date: getLocalDateString()
      });

      await fetchTodaysProgress();
      setCurrentWorkoutLog(null);
      clearWorkoutLogId();

      // Refresh calendar data for immediate UI update
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('workoutCompleted', { 
          detail: { workoutLogId, duration, notes } 
        }));
      }

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

  // Calculate actual workout totals from logged exercises
  const calculateActualWorkoutTotals = async (workoutLogId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        actualExercises: 0,
        actualSets: 0,
        actualReps: 0,
        actualWeightLifted: 0,
        actualDuration: 0
      };
    }

    console.log("Calculating actual workout totals for:", workoutLogId || "today");

    // Query exercise logs for today or specific workout
    let query = supabase
      .from('exercise_logs')
      .select('sets_completed, reps_completed, weight_used, completed_at')
      .eq('user_id', user.id);

    if (workoutLogId) {
      query = query.eq('workout_log_id', workoutLogId);
    } else {
      // Get today's exercises
      const today = getLocalDateString();
      const tomorrow = getLocalTomorrowString();
      query = query
        .gte('completed_at', today)
        .lt('completed_at', tomorrow);
    }

    const { data: exercises, error } = await query;

    if (error) {
      console.error('Error fetching exercise totals:', error);
      return {
        actualExercises: 0,
        actualSets: 0,
        actualReps: 0,
        actualWeightLifted: 0,
        actualDuration: 0
      };
    }

    if (!exercises || exercises.length === 0) {
      console.log("No exercises found for totals calculation");
      return {
        actualExercises: 0,
        actualSets: 0,
        actualReps: 0,
        actualWeightLifted: 0,
        actualDuration: 0
      };
    }

    // Calculate totals
    const actualExercises = exercises.length;
    const actualSets = exercises.reduce((total, ex) => total + (ex.sets_completed || 0), 0);
    const actualReps = exercises.reduce((total, ex) => total + (ex.reps_completed || 0), 0);
    const actualWeightLifted = exercises.reduce((total, ex) => {
      const weight = ex.weight_used || 0;
      const reps = ex.reps_completed || 0;
      return total + (weight * reps); // Total weight = weight per rep × number of reps
    }, 0);

    // Calculate duration from first to last exercise
    let actualDuration = 0;
    if (exercises.length > 1) {
      const sortedTimes = exercises
        .map(ex => new Date(ex.completed_at).getTime())
        .sort((a, b) => a - b);
      const durationMs = sortedTimes[sortedTimes.length - 1] - sortedTimes[0];
      actualDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    } else if (exercises.length === 1) {
      actualDuration = 15; // Default for single exercise
    }

    console.log("Calculated totals:", {
      actualExercises,
      actualSets,
      actualReps,
      actualWeightLifted,
      actualDuration
    });

    return {
      actualExercises,
      actualSets,
      actualReps,
      actualWeightLifted,
      actualDuration
    };
  };

  // Get today's completed exercises by name (for checking if an exercise is completed)
  const getTodaysCompletedExercises = async (): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user found for getTodaysCompletedExercises");
      return [];
    }

    console.log("Fetching today's completed exercises for user:", user.id);
    const today = getLocalDateString();
    const tomorrow = getLocalTomorrowString();
    
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('exercise_name')
      .eq('user_id', user.id)
      .gte('completed_at', today)
      .lt('completed_at', tomorrow);

    if (error) {
      console.error('Error fetching completed exercises:', error);
      return [];
    }

    console.log("Exercise logs data:", data);
    const exerciseNames = data?.map(log => log.exercise_name) || [];
    console.log("Completed exercise names:", exerciseNames);
    return exerciseNames;
  };

  // Initialize workout log on component mount
  useEffect(() => {
    const initializeWorkoutLog = async () => {
      console.log("Initializing workout log...");
      
      // First try to load from storage
      const existingLog = await loadExistingWorkoutLog();
      if (existingLog) {
        console.log("Loaded existing workout log from storage");
        return;
      }

      // If not in storage, check database for today's active workout
      const todaysLog = await getTodaysActiveWorkoutLog();
      if (todaysLog) {
        console.log("Found today's active workout log in database");
        return;
      }

      console.log("No active workout log found");
    };

    initializeWorkoutLog();
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
    calculateActualWorkoutTotals,
    refreshProgress: fetchTodaysProgress
  };
};
