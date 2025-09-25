import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MonthlyWorkoutService } from '@/services/monthlyWorkoutService';
import { CalorieWorkoutAdapterService } from '@/services/calorieWorkoutAdapterService';
import { FitnessPreferences } from './useWorkoutPlan';
import { UserWeightProfile } from '@/services/weightCalculationService';

export interface MonthlyWorkoutPlan {
  id?: string;
  template_name: string;
  duration_days: number;
  total_weeks: number;
  weekly_structure: WeeklyStructure[];
  adaptation_triggers: any;
  progression_metrics: any;
  created_at?: string;
}

export interface WeeklyStructure {
  week_number: number;
  intensity_modifier: number;
  workouts: WeeklyWorkout[];
}

export interface WeeklyWorkout {
  day: string;
  time: string;
  muscle_group: string;
  duration: number;
  week_number: number;
  exercises: MonthlyExercise[];
}

export interface MonthlyExercise {
  machine: string;
  exercise_type: string;
  order: number;
  form_instructions?: string;
  progression_notes?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  weight_guidance?: string;
  rest_seconds: number;
  duration_minutes?: number;
  intensity?: string;
  calories_per_minute?: number;
}

export interface CalibrationResults {
  id?: string;
  user_id: string;
  calibration_date: string;
  strength_metrics: any;
  endurance_metrics: any;
  baseline_weights: any;
  fitness_assessment: string;
  recommendations: any[];
  completed_at: string;
}

export interface AdaptationSummary {
  date: string;
  trigger_type: string;
  adaptations_applied: string[];
  reasoning: string;
}

export const useMonthlyWorkoutPlan = () => {
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyWorkoutPlan | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [adaptations, setAdaptations] = useState<AdaptationSummary[]>([]);
  const [calibrationResults, setCalibrationResults] = useState<CalibrationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsCalibration, setNeedsCalibration] = useState(true);

  useEffect(() => {
    loadCalibrationStatus();
    loadCurrentMonthlyPlan();
    loadRecentAdaptations();
  }, []);

  /**
   * Check if user has completed calibration
   */
  const loadCalibrationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_calibration_results')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading calibration status:', error);
        return;
      }

      if (data) {
        setCalibrationResults(data as CalibrationResults);
        setNeedsCalibration(false);
      } else {
        setNeedsCalibration(true);
      }
    } catch (error) {
      console.error('Error checking calibration status:', error);
    }
  };

  /**
   * Load current monthly workout plan
   */
  const loadCurrentMonthlyPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's current active workout plan
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error loading workout plan:', planError);
        return;
      }

      if (planData) {
        // Get monthly progress to determine current week
        const progress = await MonthlyWorkoutService.getMonthlyProgress(user.id, planData.id);
        if (progress) {
          setCurrentWeek(progress.current_week);
        }

        // For now, we'll create a basic monthly plan structure
        // This would be enhanced with the actual monthly plan data from the database
        const basicMonthlyPlan: MonthlyWorkoutPlan = {
          id: planData.id,
          template_name: planData.name,
          duration_days: 30,
          total_weeks: 4,
          weekly_structure: [], // This would be populated from stored data
          adaptation_triggers: {},
          progression_metrics: {}
        };

        setMonthlyPlan(basicMonthlyPlan);
      }
    } catch (error) {
      console.error('Error loading monthly plan:', error);
    }
  };

  /**
   * Load recent adaptations
   */
  const loadRecentAdaptations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const recentAdaptations = await CalorieWorkoutAdapterService.getRecentAdaptations(user.id, 7);
      
      const adaptationSummaries: AdaptationSummary[] = recentAdaptations.map((adaptation: any) => ({
        date: new Date(adaptation.created_at).toISOString().split('T')[0],
        trigger_type: adaptation.nutrition_trigger ? 'nutrition' : 'performance',
        adaptations_applied: adaptation.adaptation_applied?.adaptations?.map((a: any) => a.description) || [],
        reasoning: adaptation.adaptation_reason || 'Automatic adaptation'
      }));

      setAdaptations(adaptationSummaries);
    } catch (error) {
      console.error('Error loading adaptations:', error);
    }
  };

  /**
   * Generate new monthly workout plan
   */
  const generateMonthlyPlan = async (preferences: FitnessPreferences) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get user profile for weight calculations
      let userProfile: UserWeightProfile | undefined;
      
      if (calibrationResults) {
        // Get user's basic info from profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('weight_kg, age, gender')
          .eq('id', user.id)
          .single();

        if (profileData) {
          userProfile = {
            weight_lbs: (profileData.weight_kg || 70) * 2.2,
            age: profileData.age || 30,
            experience_level: calibrationResults.fitness_assessment as any || 'beginner',
            primary_goal: preferences.primary_goal as any,
            gender: profileData.gender,
            current_max_weights: calibrationResults.baseline_weights || {}
          };
        }
      }

      // Generate comprehensive monthly plan
      const generatedPlan = await MonthlyWorkoutService.generateMonthlyPlan(
        preferences,
        userProfile
      );

      // Save the plan to database (enhanced workout_plans table or new monthly_plans table)
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: generatedPlan.template_name,
          fitness_goal: preferences.primary_goal,
          preferred_days: preferences.available_days,
          preferred_times: preferences.preferred_time_slots,
          max_workout_duration: preferences.session_duration_preference,
          duration_weeks: 4, // Extended for monthly plan
          is_active: true
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create monthly progress tracker
      await MonthlyWorkoutService.updateMonthlyProgress({
        user_id: user.id,
        workout_plan_id: planData.id,
        current_week: 1,
        weekly_adaptations: {},
        performance_metrics: {},
        nutrition_compliance: {}
      });

      // Create scheduled workouts for the entire month
      await createScheduledWorkouts(planData.id, generatedPlan, user.id);

      setMonthlyPlan({
        ...generatedPlan,
        id: planData.id
      });
      setCurrentWeek(1);

      toast.success('30-day workout plan generated successfully!');
      return generatedPlan;
    } catch (error) {
      console.error('Error generating monthly plan:', error);
      toast.error('Failed to generate monthly workout plan');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create scheduled workouts for the monthly plan
   */
  const createScheduledWorkouts = async (
    planId: string,
    monthlyPlan: MonthlyWorkoutPlan,
    userId: string
  ) => {
    const scheduledWorkouts = [];
    const today = new Date();

    for (const weekStructure of monthlyPlan.weekly_structure) {
      for (const workout of weekStructure.workouts) {
        // Calculate dates for each week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOffset];
          
          if (dayName === workout.day) {
            const weekOffset = (weekStructure.week_number - 1) * 7;
            const workoutDate = new Date(today);
            workoutDate.setDate(today.getDate() + weekOffset + dayOffset);

            scheduledWorkouts.push({
              workout_plan_id: planId,
              user_id: userId,
              scheduled_date: workoutDate.toISOString().split('T')[0],
              scheduled_time: workout.time,
              target_muscle_group: workout.muscle_group,
              estimated_duration: workout.duration,
              status: 'scheduled'
            });
          }
        }
      }
    }

    // Insert scheduled workouts
    const { data: workoutData, error: workoutError } = await supabase
      .from('scheduled_workouts')
      .insert(scheduledWorkouts)
      .select();

    if (workoutError) throw workoutError;

    // Create exercises for each scheduled workout
    let workoutIndex = 0;
    for (const weekStructure of monthlyPlan.weekly_structure) {
      for (const workout of weekStructure.workouts) {
        const scheduledWorkout = workoutData[workoutIndex];

        const exercises = workout.exercises.map((exercise, index) => ({
          scheduled_workout_id: scheduledWorkout.id,
          machine_name: exercise.machine,
          exercise_order: exercise.order,
          sets: exercise.sets || null,
          reps: exercise.reps || null,
          weight: exercise.weight || null,
          duration_minutes: exercise.duration_minutes || null,
          exercise_type: exercise.exercise_type,
          intensity: exercise.intensity || null,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.weight_guidance || exercise.form_instructions
        }));

        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(exercises);

        if (exerciseError) throw exerciseError;
        workoutIndex++;
      }
    }
  };

  /**
   * Check and apply calorie-based adaptations
   */
  const checkForCalorieAdaptations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const shouldAdapt = await CalorieWorkoutAdapterService.shouldAdaptToday(user.id);
      if (!shouldAdapt) return;

      const adaptationTrigger = await CalorieWorkoutAdapterService.analyzeAndAdapt(user.id);
      
      if (adaptationTrigger) {
        const newAdaptation: AdaptationSummary = {
          date: adaptationTrigger.trigger_date,
          trigger_type: 'nutrition',
          adaptations_applied: adaptationTrigger.adaptation_applied.map(a => a.description),
          reasoning: adaptationTrigger.reasoning
        };

        setAdaptations(prev => [newAdaptation, ...prev]);
        toast.info(`Workout adapted based on nutrition: ${adaptationTrigger.reasoning}`);
        return adaptationTrigger;
      }
    } catch (error) {
      console.error('Error checking for adaptations:', error);
    }
  };

  /**
   * Progress to next week
   */
  const progressToNextWeek = async () => {
    if (!monthlyPlan?.id || currentWeek >= 4) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const nextWeek = currentWeek + 1;
      
      await MonthlyWorkoutService.updateMonthlyProgress({
        user_id: user.id,
        workout_plan_id: monthlyPlan.id,
        current_week: nextWeek,
        weekly_adaptations: {},
        performance_metrics: {},
        nutrition_compliance: {}
      });

      setCurrentWeek(nextWeek);
      toast.success(`Advanced to Week ${nextWeek}!`);
    } catch (error) {
      console.error('Error progressing to next week:', error);
      toast.error('Failed to advance to next week');
    }
  };

  /**
   * Get current week's workouts
   */
  const getCurrentWeekWorkouts = (): WeeklyWorkout[] => {
    if (!monthlyPlan) return [];
    
    const currentWeekStructure = monthlyPlan.weekly_structure.find(
      week => week.week_number === currentWeek
    );
    
    return currentWeekStructure?.workouts || [];
  };

  /**
   * Calculate plan progress percentage
   */
  const getProgressPercentage = (): number => {
    if (!monthlyPlan) return 0;
    return (currentWeek / monthlyPlan.total_weeks) * 100;
  };

  return {
    // State
    monthlyPlan,
    currentWeek,
    adaptations,
    calibrationResults,
    loading,
    needsCalibration,
    
    // Actions
    generateMonthlyPlan,
    checkForCalorieAdaptations,
    progressToNextWeek,
    
    // Computed
    getCurrentWeekWorkouts,
    getProgressPercentage,
    
    // Refresh functions
    refreshPlan: loadCurrentMonthlyPlan,
    refreshCalibration: loadCalibrationStatus,
    refreshAdaptations: loadRecentAdaptations
  };
};