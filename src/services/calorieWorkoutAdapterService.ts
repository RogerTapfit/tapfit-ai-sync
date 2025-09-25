import { supabase } from '@/integrations/supabase/client';
import { DailyNutritionSummary } from '@/hooks/useNutrition';

export interface CalorieAdaptationRule {
  trigger: 'excess' | 'deficit' | 'poor_quality' | 'excellent';
  threshold: number;
  adaptations: WorkoutAdaptation[];
}

export interface WorkoutAdaptation {
  type: 'cardio_increase' | 'intensity_boost' | 'extra_sets' | 'reduced_rest' | 'metabolic_circuit' | 'maintain' | 'recovery_focus';
  magnitude: number; // Percentage or absolute change
  description: string;
  duration_days: number; // How long this adaptation lasts
}

export interface AdaptationTrigger {
  user_id: string;
  trigger_date: string;
  nutrition_data: DailyNutritionSummary;
  calorie_variance: number; // Difference from target
  health_grade: number; // 0-100 score
  adaptation_applied: WorkoutAdaptation[];
  reasoning: string;
}

export class CalorieWorkoutAdapterService {
  
  private static readonly ADAPTATION_RULES: CalorieAdaptationRule[] = [
    {
      trigger: 'excess',
      threshold: 500, // 500+ calories over target
      adaptations: [
        {
          type: 'cardio_increase',
          magnitude: 50, // 50% more cardio duration
          description: 'Extended cardio to burn excess calories',
          duration_days: 2
        },
        {
          type: 'intensity_boost',
          magnitude: 20, // 20% higher intensity
          description: 'Increased workout intensity for higher calorie burn',
          duration_days: 1
        },
        {
          type: 'reduced_rest',
          magnitude: -25, // 25% less rest time
          description: 'Shorter rest periods for metabolic boost',
          duration_days: 1
        }
      ]
    },
    {
      trigger: 'deficit',
      threshold: -300, // 300+ calories under target
      adaptations: [
        {
          type: 'maintain',
          magnitude: 0,
          description: 'Maintain current intensity to preserve muscle',
          duration_days: 3
        },
        {
          type: 'recovery_focus',
          magnitude: -15, // 15% reduced intensity
          description: 'Focus on recovery with adequate nutrition',
          duration_days: 2
        }
      ]
    },
    {
      trigger: 'poor_quality',
      threshold: 0.6, // Health grade below 60%
      adaptations: [
        {
          type: 'metabolic_circuit',
          magnitude: 100, // Add full metabolic circuit
          description: 'Added metabolic circuit to improve insulin sensitivity',
          duration_days: 3
        },
        {
          type: 'cardio_increase',
          magnitude: 30, // 30% more cardio
          description: 'Increased cardio to offset poor food choices',
          duration_days: 2
        }
      ]
    },
    {
      trigger: 'excellent',
      threshold: 0.9, // 90%+ compliance and good choices
      adaptations: [
        {
          type: 'intensity_boost',
          magnitude: 15, // 15% intensity increase
          description: 'Progressive overload due to excellent nutrition',
          duration_days: 7
        },
        {
          type: 'extra_sets',
          magnitude: 1, // Add 1 extra set
          description: 'Added volume to capitalize on good nutrition',
          duration_days: 5
        }
      ]
    }
  ];

  /**
   * Analyze nutrition data and determine workout adaptations
   */
  static async analyzeAndAdapt(userId: string): Promise<AdaptationTrigger | null> {
    try {
      // Get recent nutrition data (last 3 days)
      const nutritionData = await this.getRecentNutritionData(userId, 3);
      
      if (nutritionData.length === 0) {
        console.log('No recent nutrition data found for adaptation');
        return null;
      }

      // Get user's nutrition targets
      const targets = await this.getUserNutritionTargets(userId);
      
      if (!targets) {
        console.log('No nutrition targets found for user');
        return null;
      }

      // Analyze patterns and determine adaptations
      const analysis = this.analyzeNutritionPatterns(nutritionData, targets);
      
      if (!analysis.needsAdaptation) {
        console.log('No workout adaptation needed based on nutrition');
        return null;
      }

      // Create adaptation trigger
      const adaptationTrigger: AdaptationTrigger = {
        user_id: userId,
        trigger_date: new Date().toISOString().split('T')[0],
        nutrition_data: nutritionData[0], // Most recent day
        calorie_variance: analysis.calorieVariance,
        health_grade: analysis.healthGrade,
        adaptation_applied: analysis.adaptations,
        reasoning: analysis.reasoning
      };

      // Save the adaptation
      await this.saveAdaptationTrigger(adaptationTrigger);

      return adaptationTrigger;
    } catch (error) {
      console.error('Error analyzing nutrition for workout adaptation:', error);
      return null;
    }
  }

  /**
   * Get recent nutrition data for analysis
   */
  private static async getRecentNutritionData(userId: string, days: number): Promise<DailyNutritionSummary[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('summary_date', startDate.toISOString().split('T')[0])
      .order('summary_date', { ascending: false });

    if (error) {
      console.error('Error fetching nutrition data:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's current nutrition targets
   */
  private static async getUserNutritionTargets(userId: string) {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching nutrition targets:', error);
      return null;
    }

    return data;
  }

  /**
   * Analyze nutrition patterns and determine needed adaptations
   */
  private static analyzeNutritionPatterns(
    nutritionData: DailyNutritionSummary[],
    targets: any
  ) {
    // Calculate average calorie variance over the period
    const calorieVariances = nutritionData.map(day => 
      day.total_calories - targets.daily_calories
    );
    const avgCalorieVariance = calorieVariances.reduce((sum, variance) => sum + variance, 0) / calorieVariances.length;

    // Calculate health grade (simplified - based on macro balance)
    let healthGrade = 0.75; // Base grade

    // Check if recent data shows concerning patterns
    const recentExcess = calorieVariances.filter(v => v > 300).length;
    const recentDeficit = calorieVariances.filter(v => v < -200).length;
    
    if (recentExcess > 1) healthGrade -= 0.15; // Consistent overeating
    if (recentDeficit > 2) healthGrade -= 0.10; // Consistent undereating
    
    // Protein adequacy check
    const proteinDeficit = nutritionData.filter(day => 
      day.total_protein < targets.protein_grams * 0.8
    ).length;
    if (proteinDeficit > 1) healthGrade -= 0.10;

    healthGrade = Math.max(0.3, Math.min(1.0, healthGrade));

    // Determine which adaptation rule applies
    let applicableRule: CalorieAdaptationRule | null = null;
    let reasoning = '';

    if (avgCalorieVariance >= 500) {
      applicableRule = this.ADAPTATION_RULES.find(rule => rule.trigger === 'excess') || null;
      reasoning = `Consistent calorie excess (+${Math.round(avgCalorieVariance)} calories/day average)`;
    } else if (avgCalorieVariance <= -300) {
      applicableRule = this.ADAPTATION_RULES.find(rule => rule.trigger === 'deficit') || null;
      reasoning = `Calorie deficit (${Math.round(avgCalorieVariance)} calories/day average)`;
    } else if (healthGrade < 0.6) {
      applicableRule = this.ADAPTATION_RULES.find(rule => rule.trigger === 'poor_quality') || null;
      reasoning = `Poor nutrition quality (${Math.round(healthGrade * 100)}% health score)`;
    } else if (healthGrade >= 0.9 && Math.abs(avgCalorieVariance) < 200) {
      applicableRule = this.ADAPTATION_RULES.find(rule => rule.trigger === 'excellent') || null;
      reasoning = `Excellent nutrition compliance (${Math.round(healthGrade * 100)}% health score)`;
    }

    return {
      needsAdaptation: applicableRule !== null,
      calorieVariance: avgCalorieVariance,
      healthGrade: healthGrade * 100, // Convert to 0-100 scale
      adaptations: applicableRule?.adaptations || [],
      reasoning
    };
  }

  /**
   * Save adaptation trigger to database
   */
  private static async saveAdaptationTrigger(trigger: AdaptationTrigger) {
    try {
      // First, get the user's current active workout plan
      const { data: workoutPlan, error: planError } = await supabase
        .from('workout_plans')
        .select('id')
        .eq('user_id', trigger.user_id)
        .eq('is_active', true)
        .single();

      if (planError || !workoutPlan) {
        console.log('No active workout plan found for adaptation');
        return;
      }

      // Save to workout_adaptations table
      const { error } = await supabase
        .from('workout_adaptations')
        .insert([{
          user_id: trigger.user_id,
          workout_plan_id: workoutPlan.id,
          adaptation_week: this.getCurrentWeekNumber(),
          nutrition_trigger: {
            calorie_variance: trigger.calorie_variance,
            health_grade: trigger.health_grade,
            nutrition_summary: trigger.nutrition_data
          },
          adaptation_applied: {
            adaptations: trigger.adaptation_applied,
            trigger_date: trigger.trigger_date
          },
          adaptation_reason: trigger.reasoning
        }]);

      if (error) {
        console.error('Error saving adaptation trigger:', error);
      }
    } catch (error) {
      console.error('Error saving adaptation trigger:', error);
    }
  }

  /**
   * Get current week number (simple implementation)
   */
  private static getCurrentWeekNumber(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  /**
   * Apply adaptations to upcoming workouts
   */
  static async applyAdaptationsToWorkout(
    userId: string, 
    workoutId: string, 
    adaptations: WorkoutAdaptation[]
  ): Promise<any> {
    try {
      // Get the current workout
      const { data: workout, error } = await supabase
        .from('scheduled_workouts')
        .select(`
          *,
          workout_exercises (*)
        `)
        .eq('id', workoutId)
        .single();

      if (error || !workout) {
        console.error('Workout not found for adaptation');
        return null;
      }

      // Apply each adaptation
      const modifiedExercises = workout.workout_exercises.map((exercise: any) => {
        let modifiedExercise = { ...exercise };

        adaptations.forEach(adaptation => {
          switch (adaptation.type) {
            case 'cardio_increase':
              if (exercise.exercise_type === 'cardio') {
                modifiedExercise.duration_minutes = Math.round(
                  exercise.duration_minutes * (1 + adaptation.magnitude / 100)
                );
              }
              break;
              
            case 'intensity_boost':
              if (exercise.sets && exercise.reps) {
                modifiedExercise.reps = Math.ceil(
                  exercise.reps * (1 + adaptation.magnitude / 100)
                );
              }
              break;
              
            case 'extra_sets':
              if (exercise.sets) {
                modifiedExercise.sets = exercise.sets + Math.floor(adaptation.magnitude);
              }
              break;
              
            case 'reduced_rest':
              modifiedExercise.rest_seconds = Math.round(
                exercise.rest_seconds * (1 + adaptation.magnitude / 100)
              );
              break;
              
            case 'recovery_focus':
              if (exercise.sets && exercise.reps) {
                modifiedExercise.reps = Math.max(
                  Math.floor(exercise.reps * (1 + adaptation.magnitude / 100)),
                  exercise.reps - 3 // Don't reduce by more than 3 reps
                );
              }
              break;
          }
        });

        return modifiedExercise;
      });

      return {
        original_workout: workout,
        adapted_exercises: modifiedExercises,
        adaptations_applied: adaptations,
        adaptation_summary: adaptations.map(a => a.description).join(', ')
      };
    } catch (error) {
      console.error('Error applying adaptations to workout:', error);
      return null;
    }
  }

  /**
   * Get recent adaptations for a user
   */
  static async getRecentAdaptations(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('workout_adaptations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent adaptations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if user needs adaptation today
   */
  static async shouldAdaptToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already adapted today
    const { data, error } = await supabase
      .from('workout_adaptations')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .limit(1);

    if (error) {
      console.error('Error checking adaptation status:', error);
      return false;
    }

    // If already adapted today, don't adapt again
    return (data || []).length === 0;
  }
}