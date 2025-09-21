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

  // Function to generate calendar data for a given month
  const generateCalendarData = async (month: Date) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch comprehensive data in parallel
      const [workoutLogsResponse, foodEntriesResponse, dailyStepsResponse] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('started_at', startDateStr)
          .lte('started_at', endDateStr + 'T23:59:59'),
          
        supabase
          .from('food_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('logged_date', startDateStr)
          .lte('logged_date', endDateStr),
          
        supabase
          .from('daily_steps')
          .select('*')
          .eq('user_id', userId)
          .gte('recorded_date', startDateStr)
          .lte('recorded_date', endDateStr)
      ]);

      const newCalendarData = new Map<string, CalendarDay>();
      const workoutLogs = workoutLogsResponse.data || [];
      const fetchedFoodEntries = foodEntriesResponse.data || [];
      const dailySteps = dailyStepsResponse.data || [];

      // Generate days for the month
      for (let day = 1; day <= endDate.getDate(); day++) {
        const currentDate = new Date(month.getFullYear(), month.getMonth(), day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Get workouts for this day
        const dayWorkouts: WorkoutActivity[] = workoutLogs
          .filter(log => new Date(log.started_at).toISOString().split('T')[0] === dateString)
          .map(log => ({
            id: log.id,
            type: 'completed' as const,
            name: log.workout_name || 'Workout',
            muscleGroup: log.muscle_group || 'general',
            duration: log.duration_minutes || 0,
            exercises: log.completed_exercises || 0,
            calories: log.calories_burned
          }));
        
        // Get food entries for this day
        const dayFoodEntries: FoodActivity[] = fetchedFoodEntries
          .filter(food => food.logged_date === dateString)
          .map(food => ({
            id: food.id,
            mealType: food.meal_type,
            totalCalories: food.total_calories,
            photoUrl: food.photo_url,
            healthGrade: food.health_grade,
            time: new Date(food.created_at).toISOString()
          }));
        
        // Get steps for this day
        const dayStep = dailySteps.find(step => step.recorded_date === dateString);
        
        // Calculate daily stats
        const totalWorkoutCalories = dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
        const totalConsumedCalories = dayFoodEntries.reduce((sum, f) => sum + f.totalCalories, 0);
        const totalExercises = dayWorkouts.reduce((sum, w) => sum + w.exercises, 0);
        const totalWorkoutDuration = dayWorkouts.reduce((sum, w) => sum + w.duration, 0);
        
        newCalendarData.set(dateString, {
          date: currentDate,
          dateString,
          workouts: dayWorkouts,
          foodEntries: dayFoodEntries,
          steps: dayStep?.step_count || 0,
          calories: totalWorkoutCalories,
          dailyStats: {
            caloriesBurned: totalWorkoutCalories + Math.round((dayStep?.step_count || 0) * 0.04),
            caloriesConsumed: totalConsumedCalories,
            exercisesCompleted: totalExercises,
            workoutDuration: totalWorkoutDuration
          },
          hasActivity: dayWorkouts.length > 0 || dayFoodEntries.length > 0 || (dayStep?.step_count || 0) > 0
        });
      }

      setCalendarData(newCalendarData);
    } catch (error) {
      console.error('Error generating calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when userId or currentMonth changes
  useEffect(() => {
    generateCalendarData(currentMonth);
  }, [userId, currentMonth]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Generate calendar days for display (with padding)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: (CalendarDay | null)[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateString = current.toISOString().split('T')[0];
      
      if (current.getMonth() === month) {
        days.push(calendarData.get(dateString) || {
          date: new Date(current),
          dateString,
          workouts: [],
          foodEntries: [],
          steps: 0,
          calories: 0,
          dailyStats: {
            caloriesBurned: 0,
            caloriesConsumed: 0,
            exercisesCompleted: 0,
            workoutDuration: 0
          },
          hasActivity: false
        });
      } else {
        days.push(null);
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [calendarData, currentMonth]);

  const refreshData = () => {
    generateCalendarData(currentMonth);
  };

  return {
    calendarDays,
    currentMonth,
    loading,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    refreshData
  };
};