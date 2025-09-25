import { supabase } from '@/integrations/supabase/client';
import { FitnessPreferences } from '@/hooks/useWorkoutPlan';
import { 
  calculateOptimalWeight, 
  calculateSetsAndReps, 
  UserWeightProfile 
} from './weightCalculationService';

export interface MonthlyWorkoutTemplate {
  id: string;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  primary_goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training';
  template_data: any;
  week_structure: any;
}

export interface WorkoutAdaptation {
  id?: string;
  user_id: string;
  workout_plan_id: string;
  adaptation_week: number;
  nutrition_trigger?: any;
  performance_trigger?: any;
  adaptation_applied: any;
  adaptation_reason?: string;
}

export interface MonthlyProgress {
  id?: string;
  user_id: string;
  workout_plan_id: string;
  current_week: number;
  weekly_adaptations: any;
  performance_metrics: any;
  nutrition_compliance: any;
  progress_notes?: string;
}

export interface ExerciseData {
  exercise_name: string;
  machine_name: string;
  muscle_groups: string[];
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'compound' | 'isolation';
  equipment_category: 'machine' | 'free_weights' | 'cardio' | 'bodyweight';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  form_instructions?: string;
  progression_notes?: string;
  calorie_burn_rate: number;
}

export class MonthlyWorkoutService {
  
  /**
   * Generate a comprehensive 30-day workout plan
   */
  static async generateMonthlyPlan(preferences: FitnessPreferences, userProfile?: UserWeightProfile) {
    try {
      // Get appropriate workout template
      const template = await this.getWorkoutTemplate(
        preferences.current_fitness_level,
        preferences.primary_goal
      );

      if (!template) {
        throw new Error('No suitable workout template found');
      }

      // Get exercise database
      const exercises = await this.getExerciseDatabase();

      // Generate 30-day structured plan
      const monthlyPlan = await this.buildMonthlyStructure(
        template, 
        preferences, 
        exercises, 
        userProfile
      );

      return monthlyPlan;
    } catch (error) {
      console.error('Error generating monthly plan:', error);
      throw error;
    }
  }

  /**
   * Get workout template based on fitness level and goal
   */
  private static async getWorkoutTemplate(
    fitness_level: string,
    primary_goal: string
  ): Promise<MonthlyWorkoutTemplate | null> {
    const { data, error } = await supabase
      .from('monthly_workout_templates')
      .select('*')
      .eq('fitness_level', fitness_level)
      .eq('primary_goal', primary_goal)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching workout template:', error);
      return null;
    }

    return data as MonthlyWorkoutTemplate;
  }

  /**
   * Get enhanced exercise database
   */
  private static async getExerciseDatabase(): Promise<ExerciseData[]> {
    const { data, error } = await supabase
      .from('exercise_database')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching exercise database:', error);
      return [];
    }

    return (data || []) as ExerciseData[];
  }

  /**
   * Build comprehensive 30-day workout structure
   */
  private static async buildMonthlyStructure(
    template: MonthlyWorkoutTemplate,
    preferences: FitnessPreferences,
    exercises: ExerciseData[],
    userProfile: UserWeightProfile | undefined = undefined
  ) {
    const weeklyStructure = [];
    const templateData = template.template_data;
    const weekStructure = template.week_structure;

    // Generate 4 weeks + 2 bonus days (30 days total)
    for (let week = 1; week <= 4; week++) {
      const weekIntensity = weekStructure[`week${week}`]?.intensity || 0.7;
      
      const weekPlan = {
        week_number: week,
        intensity_modifier: weekIntensity,
        workouts: await this.generateWeeklyWorkouts(
          preferences,
          exercises,
          templateData,
          weekIntensity,
          userProfile,
          week
        )
      };
      
      weeklyStructure.push(weekPlan);
    }

    return {
      template_name: `${template.fitness_level} ${template.primary_goal} - 30 Day Plan`,
      duration_days: 30,
      total_weeks: 4,
      weekly_structure: weeklyStructure,
      adaptation_triggers: this.getAdaptationTriggers(preferences),
      progression_metrics: this.getProgressionMetrics(template.primary_goal)
    };
  }

  /**
   * Generate weekly workout distribution
   */
  private static async generateWeeklyWorkouts(
    preferences: FitnessPreferences,
    exercises: ExerciseData[],
    templateData: any,
    intensity: number,
    weekNumber: number,
    userProfile: UserWeightProfile | undefined = undefined
  ) {
    const workouts = [];
    const availableDays = preferences.available_days;
    const workoutFrequency = Math.min(preferences.workout_frequency, availableDays.length);

    // Distribute muscle groups across available days
    const muscleGroupRotation = this.createMuscleGroupRotation(
      preferences.target_muscle_groups || ['chest', 'back', 'shoulders', 'legs'], 
      workoutFrequency
    );

    for (let dayIndex = 0; dayIndex < workoutFrequency; dayIndex++) {
      const dayName = availableDays[dayIndex % availableDays.length];
      const muscleGroup = muscleGroupRotation[dayIndex % muscleGroupRotation.length];
      const timeSlot = preferences.preferred_time_slots[0] || '18:00';

      const dayWorkout = {
        day: dayName,
        time: timeSlot,
        muscle_group: muscleGroup,
        duration: preferences.session_duration_preference,
        week_number: weekNumber,
        exercises: await this.selectExercisesForMuscleGroup(
          muscleGroup,
          exercises,
          templateData,
          intensity,
          userProfile,
          preferences.current_fitness_level
        )
      };

      workouts.push(dayWorkout);
    }

    return workouts;
  }

  /**
   * Create muscle group rotation for balanced training
   */
  private static createMuscleGroupRotation(targetGroups: string[], frequency: number): string[] {
    const coreGroups = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];
    const selectedGroups = targetGroups.length > 0 ? targetGroups : coreGroups;
    
    // Ensure we have enough muscle groups for the frequency
    while (selectedGroups.length < frequency) {
      selectedGroups.push(...selectedGroups);
    }
    
    return selectedGroups.slice(0, frequency);
  }

  /**
   * Select exercises for specific muscle group with equipment balancing
   */
  private static async selectExercisesForMuscleGroup(
    muscleGroup: string,
    exercises: ExerciseData[],
    templateData: any,
    intensity: number,
    fitnessLevel: string,
    userProfile: UserWeightProfile | undefined = undefined
  ) {
    // Filter exercises for this muscle group
    const relevantExercises = exercises.filter(ex => 
      ex.muscle_groups.includes(muscleGroup) &&
      (ex.difficulty_level === fitnessLevel || ex.difficulty_level === 'beginner')
    );

    // Balance equipment types (60% machines, 30% free weights, 10% cardio)
    const machineExercises = relevantExercises.filter(ex => ex.equipment_category === 'machine');
    const freeWeightExercises = relevantExercises.filter(ex => ex.equipment_category === 'free_weights');
    const cardioExercises = exercises.filter(ex => ex.equipment_category === 'cardio');

    const exerciseCount = templateData.exercises_per_day || 6;
    const selectedExercises = [];

    // Select main exercises (machines and free weights)
    const mainCount = Math.floor(exerciseCount * 0.85);
    for (let i = 0; i < mainCount; i++) {
      const usesMachine = i < mainCount * 0.7; // 70% machines
      const pool = usesMachine ? machineExercises : freeWeightExercises;
      
      if (pool.length > 0) {
        const exercise = pool[i % pool.length];
        const exerciseDetails = await this.calculateExerciseDetails(
          exercise,
          templateData,
          intensity,
          userProfile,
          i + 1
        );
        selectedExercises.push(exerciseDetails);
      }
    }

    // Add cardio finisher
    if (cardioExercises.length > 0 && selectedExercises.length < exerciseCount) {
      const cardioExercise = cardioExercises[0]; // Prefer treadmill
      selectedExercises.push({
        machine: cardioExercise.machine_name || cardioExercise.exercise_name,
        exercise_type: 'cardio',
        duration_minutes: 10 + Math.floor(intensity * 10), // 10-20 minutes
        intensity: intensity > 0.8 ? 'high' : intensity > 0.6 ? 'moderate' : 'low',
        rest_seconds: 0,
        order: selectedExercises.length + 1,
        form_instructions: cardioExercise.form_instructions,
        calories_per_minute: cardioExercise.calorie_burn_rate
      });
    }

    return selectedExercises;
  }

  /**
   * Calculate precise exercise details with weight recommendations
   */
  private static async calculateExerciseDetails(
    exercise: ExerciseData,
    templateData: any,
    intensity: number,
    order: number,
    userProfile: UserWeightProfile | undefined = undefined
  ) {
    const baseDetails = {
      machine: exercise.machine_name || exercise.exercise_name,
      exercise_type: exercise.exercise_type,
      order,
      form_instructions: exercise.form_instructions,
      progression_notes: exercise.progression_notes
    };

    if (exercise.exercise_type === 'cardio') {
      return {
        ...baseDetails,
        duration_minutes: Math.floor(15 + intensity * 10),
        intensity: intensity > 0.8 ? 'high' : intensity > 0.6 ? 'moderate' : 'low',
        rest_seconds: 60,
        calories_per_minute: exercise.calorie_burn_rate
      };
    }

    // Calculate sets and reps based on goal and experience
    const setsAndReps = calculateSetsAndReps(
      userProfile?.primary_goal || 'general_fitness',
      userProfile?.experience_level || 'beginner',
      exercise.exercise_type as 'compound' | 'isolation'
    );

    let weight = undefined;
    let weight_guidance = "Start with a comfortable weight";

    // Calculate specific weight if user profile available
    if (userProfile) {
      try {
        weight = calculateOptimalWeight(
          userProfile,
          exercise.exercise_name,
          exercise.machine_name || exercise.exercise_name
        );
        weight_guidance = `Recommended: ${weight}kg (${Math.round(weight * 2.2)}lbs)`;
      } catch (error) {
        console.error('Error calculating weight:', error);
      }
    }

    return {
      ...baseDetails,
      sets: Math.floor(setsAndReps.sets * intensity),
      reps: setsAndReps.reps,
      weight,
      weight_guidance,
      rest_seconds: setsAndReps.rest_seconds
    };
  }

  /**
   * Define adaptation triggers for calorie-based adjustments
   */
  private static getAdaptationTriggers(preferences: FitnessPreferences) {
    return {
      calorie_excess: {
        threshold: 500, // calories over target
        adaptations: ['increase_cardio', 'add_extra_set', 'reduce_rest_time']
      },
      calorie_deficit: {
        threshold: -300, // calories under target
        adaptations: ['maintain_intensity', 'focus_protein', 'adequate_rest']
      },
      poor_nutrition_quality: {
        threshold: 0.6, // health grade below 60%
        adaptations: ['increase_cardio_duration', 'add_core_work', 'metabolic_circuit']
      },
      excellent_compliance: {
        threshold: 0.9, // 90%+ nutrition compliance
        adaptations: ['progressive_overload', 'add_complexity', 'skill_variations']
      }
    };
  }

  /**
   * Define progression metrics based on goal
   */
  private static getProgressionMetrics(goal: string) {
    const baseMetrics = {
      weekly_volume_increase: 5, // 5% per week
      weight_progression: 2.5, // 2.5kg increments
      endurance_progression: 10 // 10% duration increase
    };

    switch (goal) {
      case 'strength_training':
        return {
          ...baseMetrics,
          weight_progression: 5, // Faster strength progression
          weekly_volume_increase: 3
        };
      case 'fat_loss':
        return {
          ...baseMetrics,
          cardio_emphasis: 1.5, // 50% more cardio
          rest_time_reduction: 0.9 // 10% less rest
        };
      case 'muscle_building':
        return {
          ...baseMetrics,
          volume_emphasis: 1.3, // 30% more volume
          rest_time_increase: 1.2 // 20% more rest
        };
      default:
        return baseMetrics;
    }
  }

  /**
   * Track and save workout adaptation
   */
  static async saveWorkoutAdaptation(adaptation: Omit<WorkoutAdaptation, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('workout_adaptations')
        .insert(adaptation)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving workout adaptation:', error);
      throw error;
    }
  }

  /**
   * Update monthly progress
   */
  static async updateMonthlyProgress(progress: Omit<MonthlyProgress, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('monthly_workout_progress')
        .upsert(progress)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating monthly progress:', error);
      throw error;
    }
  }

  /**
   * Get user's current monthly progress
   */
  static async getMonthlyProgress(userId: string, workoutPlanId: string) {
    try {
      const { data, error } = await supabase
        .from('monthly_workout_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_plan_id', workoutPlanId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting monthly progress:', error);
      return null;
    }
  }
}