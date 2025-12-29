import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, eachDayOfInterval, isWithinInterval } from 'date-fns';

interface DayWorkout {
  date: Date;
  dayName: string;
  hasWorkout: boolean;
  workoutCount: number;
  workoutIds: string[];
}

interface WeeklyStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalCalories: number;
  dailyBreakdown: DayWorkout[];
  topExercises: { name: string; count: number }[];
}

export const useWeeklyWorkoutStats = (userId: string | null) => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

        // Fetch workout logs for this week
        const { data: workoutLogs, error: workoutError } = await supabase
          .from('workout_logs')
          .select('id, completed_at')
          .eq('user_id', userId)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString())
          .not('completed_at', 'is', null);

        if (workoutError) {
          console.error('Error fetching workout logs:', workoutError);
        }

        // Fetch exercise logs for this week's workouts
        const workoutIds = workoutLogs?.map(w => w.id) || [];
        let exerciseLogs: any[] = [];
        
        if (workoutIds.length > 0) {
          const { data: exercises, error: exerciseError } = await supabase
            .from('exercise_logs')
            .select('exercise_name, sets_completed, reps_completed, weight_used')
            .in('workout_log_id', workoutIds);

          if (exerciseError) {
            console.error('Error fetching exercise logs:', exerciseError);
          }
          exerciseLogs = exercises || [];
        }

        // Calculate daily breakdown
        const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const dailyBreakdown: DayWorkout[] = daysOfWeek.map(date => {
          const workoutsOnDay = workoutLogs?.filter(w => {
            const workoutDate = new Date(w.completed_at!);
            return format(workoutDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          }) || [];

          return {
            date,
            dayName: format(date, 'EEE'),
            hasWorkout: workoutsOnDay.length > 0,
            workoutCount: workoutsOnDay.length,
            workoutIds: workoutsOnDay.map(w => w.id)
          };
        });

        // Calculate totals
        const totalSets = exerciseLogs.reduce((sum, e) => sum + (e.sets_completed || 0), 0);
        const totalReps = exerciseLogs.reduce((sum, e) => sum + (e.reps_completed || 0), 0);
        const totalVolume = exerciseLogs.reduce((sum, e) => {
          return sum + ((e.weight_used || 0) * (e.reps_completed || 0) * (e.sets_completed || 1));
        }, 0);

        // Estimate calories (rough estimate: 5 calories per set)
        const totalCalories = totalSets * 5;

        // Get top exercises
        const exerciseCounts: Record<string, number> = {};
        exerciseLogs.forEach(e => {
          exerciseCounts[e.exercise_name] = (exerciseCounts[e.exercise_name] || 0) + 1;
        });
        
        const topExercises = Object.entries(exerciseCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({
          totalWorkouts: workoutLogs?.length || 0,
          totalSets,
          totalReps,
          totalVolume,
          totalCalories,
          dailyBreakdown,
          topExercises
        });
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [userId]);

  return { stats, loading };
};
