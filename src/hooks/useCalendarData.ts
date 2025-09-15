import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNutrition } from './useNutrition';
import { useDailyStats } from './useDailyStats';
import { useWorkoutPlan } from './useWorkoutPlan';

export interface CalendarDay {
  date: Date;
  dateString: string;
  workouts: WorkoutActivity[];
  foodEntries: FoodActivity[];
  steps: number;
  calories: number;
  dailyStats: {
    caloriesConsumed: number;
    caloriesBurned: number;
    exercisesCompleted: number;
    workoutDuration: number;
  };
  hasActivity: boolean;
}

export interface WorkoutActivity {
  id: string;
  type: 'scheduled' | 'completed' | 'missed';
  name: string;
  muscleGroup: string;
  duration: number;
  time?: string;
  exercises: number;
  calories?: number;
}

export interface FoodActivity {
  id: string;
  mealType: string;
  totalCalories: number;
  photoUrl?: string;
  healthGrade?: string;
  time: string;
}

export const useCalendarData = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<Map<string, CalendarDay>>(new Map());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { weeklySchedule } = useWorkoutPlan();
  const { foodEntries } = useNutrition();
  const dailyStats = useDailyStats(userId);

  // Generate calendar data for current month
  const generateCalendarData = async (month: Date) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Fetch workout data for the month
      const { data: workoutLogs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      // Fetch scheduled workouts for the month
      const { data: scheduledWorkouts } = await supabase
        .from('scheduled_workouts')
        .select(`
          *,
          workout_exercises (*)
        `)
        .eq('user_id', userId)
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0]);

      // Fetch food entries for the month
      const { data: monthFoodEntries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_date', startDate.toISOString().split('T')[0])
        .lte('logged_date', endDate.toISOString().split('T')[0]);

      // Fetch daily nutrition summaries
      const { data: nutritionSummaries } = await supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('summary_date', startDate.toISOString().split('T')[0])
        .lte('summary_date', endDate.toISOString().split('T')[0]);

      // Build calendar data map
      const dataMap = new Map<string, CalendarDay>();
      
      // Initialize all days in month
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        dataMap.set(dateString, {
          date: new Date(d),
          dateString,
          workouts: [],
          foodEntries: [],
          steps: 0,
          calories: 0,
          dailyStats: {
            caloriesConsumed: 0,
            caloriesBurned: 0,
            exercisesCompleted: 0,
            workoutDuration: 0,
          },
          hasActivity: false,
        });
      }

      // Add workout data
      workoutLogs?.forEach(log => {
        const date = new Date(log.started_at).toISOString().split('T')[0];
        const day = dataMap.get(date);
        if (day) {
          day.workouts.push({
            id: log.id,
            type: 'completed',
            name: log.workout_name,
            muscleGroup: log.muscle_group,
            duration: log.duration_minutes || 0,
            exercises: log.completed_exercises,
            calories: log.calories_burned,
          });
          day.dailyStats.exercisesCompleted += log.completed_exercises;
          day.dailyStats.workoutDuration += log.duration_minutes || 0;
          day.dailyStats.caloriesBurned += log.calories_burned || 0;
          day.hasActivity = true;
        }
      });

      // Add scheduled workouts
      scheduledWorkouts?.forEach(workout => {
        const day = dataMap.get(workout.scheduled_date);
        if (day) {
          const exerciseCount = workout.workout_exercises?.length || 0;
          day.workouts.push({
            id: workout.id,
            type: workout.status === 'completed' ? 'completed' : 
                  workout.status === 'missed' ? 'missed' : 'scheduled',
            name: `${workout.target_muscle_group} Workout`,
            muscleGroup: workout.target_muscle_group,
            duration: workout.estimated_duration,
            time: workout.scheduled_time,
            exercises: exerciseCount,
          });
          day.hasActivity = true;
        }
      });

      // Add food entries
      monthFoodEntries?.forEach(entry => {
        const day = dataMap.get(entry.logged_date);
        if (day) {
          day.foodEntries.push({
            id: entry.id,
            mealType: entry.meal_type,
            totalCalories: entry.total_calories,
            photoUrl: entry.photo_url,
            healthGrade: entry.health_grade,
            time: entry.created_at,
          });
          day.dailyStats.caloriesConsumed += entry.total_calories;
          day.hasActivity = true;
        }
      });

      // Add nutrition summaries
      nutritionSummaries?.forEach(summary => {
        const day = dataMap.get(summary.summary_date);
        if (day && day.dailyStats.caloriesConsumed === 0) {
          day.dailyStats.caloriesConsumed = summary.total_calories;
          day.hasActivity = day.hasActivity || summary.total_calories > 0;
        }
      });

      setCalendarData(dataMap);
    } catch (error) {
      console.error('Error generating calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate data when month changes or user changes
  useEffect(() => {
    if (userId) {
      generateCalendarData(currentMonth);
    }
  }, [userId, currentMonth]);

  // Refresh data when workout or nutrition data changes
  useEffect(() => {
    if (userId && (weeklySchedule.length > 0 || foodEntries.length > 0)) {
      generateCalendarData(currentMonth);
    }
  }, [weeklySchedule, foodEntries, userId]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get days for calendar grid (including padding days)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    const days: (CalendarDay | null)[] = [];
    
    // Add padding days from previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const dateString = new Date(year, month, date).toISOString().split('T')[0];
      const dayData = calendarData.get(dateString);
      days.push(dayData || {
        date: new Date(year, month, date),
        dateString,
        workouts: [],
        foodEntries: [],
        steps: 0,
        calories: 0,
        dailyStats: {
          caloriesConsumed: 0,
          caloriesBurned: 0,
          exercisesCompleted: 0,
          workoutDuration: 0,
        },
        hasActivity: false,
      });
    }
    
    return days;
  }, [currentMonth, calendarData]);

  return {
    calendarDays,
    currentMonth,
    loading,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    refreshData: () => generateCalendarData(currentMonth),
  };
};