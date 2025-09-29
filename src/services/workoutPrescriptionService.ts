import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  age?: number;
  sex?: 'male' | 'female';
  weight_kg?: number;
  height_cm?: number;
  HR_rest?: number;
  HR_max?: number;
  FTP_w?: number;
  vVO2max?: number;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  health_conditions?: string[];
  previous_injuries?: string[];
}

export interface SessionRequest {
  machine_id: string;
  machine_type: 'cardio' | 'strength';
  session_goal: 'endurance' | 'calories' | 'intervals' | 'recovery' | 'strength' | 'hypertrophy' | 'power';
  target_duration?: number;
  target_load?: number;
  target_calories?: number;
  target_zone?: string;
  current_fitness_level?: number;
}

export interface WorkoutBlock {
  phase: string;
  time_min: number;
  zone?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
  weight_percentage?: number;
  rest_seconds?: number;
  instructions?: string;
}

export interface WorkoutPrescription {
  session_id: string;
  machine_id: string;
  machine_type?: 'cardio' | 'strength';
  goal: string;
  total_duration_min: number;
  estimated_calories: number;
  target_trimp: number;
  blocks: WorkoutBlock[];
  adaptive_rules: string[];
  progression_notes: string;
  safety_considerations: string[];
  session_plan?: any; // For backward compatibility
}

export class WorkoutPrescriptionService {
  /**
   * Generate a personalized workout prescription
   */
  static async generateWorkoutSession(
    userProfile: UserProfile, 
    sessionRequest: SessionRequest
  ): Promise<WorkoutPrescription | null> {
    try {
      console.log('Generating workout session:', { userProfile, sessionRequest });
      
      const { data, error } = await supabase.functions.invoke('generateWorkoutSession', {
        body: {
          userProfile,
          sessionRequest
        }
      });

      if (error) {
        console.error('Workout generation error:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Workout generation failed:', data?.error);
        return null;
      }

      return data.workout;
    } catch (err) {
      console.error('Workout prescription service error:', err);
      return null;
    }
  }

  /**
   * Calculate heart rate zones based on user profile
   */
  static calculateHeartRateZones(hrRest: number, hrMax: number) {
    const hrReserve = hrMax - hrRest;
    
    return {
      Z1: {
        min: Math.round(hrRest + (hrReserve * 0.50)),
        max: Math.round(hrRest + (hrReserve * 0.60)),
        name: 'Active Recovery'
      },
      Z2: {
        min: Math.round(hrRest + (hrReserve * 0.60)),
        max: Math.round(hrRest + (hrReserve * 0.70)),
        name: 'Aerobic Base'
      },
      Z3: {
        min: Math.round(hrRest + (hrReserve * 0.70)),
        max: Math.round(hrRest + (hrReserve * 0.80)),
        name: 'Tempo'
      },
      Z4: {
        min: Math.round(hrRest + (hrReserve * 0.80)),
        max: Math.round(hrRest + (hrReserve * 0.90)),
        name: 'Lactate Threshold'
      },
      Z5: {
        min: Math.round(hrRest + (hrReserve * 0.90)),
        max: hrMax,
        name: 'VO2 Max'
      }
    };
  }

  /**
   * Calculate TRIMP (Training Impulse) score
   */
  static calculateTRIMP(blocks: WorkoutBlock[]): number {
    const zoneWeights = { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5 };
    
    return blocks.reduce((total, block) => {
      if (!block.zone || !block.time_min) return total;
      const weight = zoneWeights[block.zone as keyof typeof zoneWeights] || 2;
      return total + (block.time_min * weight);
    }, 0);
  }

  /**
   * Estimate calories burned based on METs and user weight
   */
  static estimateCalories(
    durationMin: number, 
    userWeightKg: number, 
    mets: number = 6 // Default moderate intensity
  ): number {
    // Calories = METs × weight(kg) × time(hours)
    const hours = durationMin / 60;
    return Math.round(mets * userWeightKg * hours);
  }

  /**
   * Get METs value for different machine types and intensities
   */
  static getMETsForMachine(machineType: string, intensity: 'low' | 'moderate' | 'high' = 'moderate'): number {
    const metsTable: { [key: string]: { low: number; moderate: number; high: number } } = {
      'treadmill': { low: 4.3, moderate: 7.0, high: 9.8 },
      'indoor_cycling_bike': { low: 4.8, moderate: 7.5, high: 11.0 },
      'elliptical': { low: 4.6, moderate: 6.8, high: 9.5 },
      'rowing_machine': { low: 4.8, moderate: 7.0, high: 12.0 },
      'stair_climber': { low: 5.0, moderate: 7.7, high: 10.5 },
      'strength_training': { low: 3.0, moderate: 3.5, high: 6.0 }
    };

    const machine = metsTable[machineType] || metsTable['strength_training'];
    return machine[intensity];
  }

  /**
   * Validate workout prescription for safety
   */
  static validateWorkoutSafety(
    workout: WorkoutPrescription, 
    userProfile: UserProfile
  ): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check for health conditions
    if (userProfile.health_conditions?.includes('heart_disease')) {
      if (workout.blocks.some(b => b.zone === 'Z4' || b.zone === 'Z5')) {
        warnings.push('High intensity zones not recommended with heart conditions');
      }
    }

    // Check for joint issues
    if (userProfile.previous_injuries?.includes('knee') || userProfile.previous_injuries?.includes('back')) {
      if (workout.machine_id.includes('LEG-PRESS') || workout.machine_id.includes('SQUAT')) {
        warnings.push('Lower body exercises may need modification due to previous injuries');
      }
    }

    // Check workout duration for beginners
    if (userProfile.experience_level === 'beginner' && workout.total_duration_min > 45) {
      warnings.push('Workout duration may be too long for beginner level');
    }

    // Check intensity progression
    if (workout.blocks.length > 1) {
      const intensityProgression = workout.blocks.map(b => {
        if (b.zone) {
          return parseInt(b.zone.replace('Z', ''));
        }
        return 2; // Default moderate
      });

      // Check if intensity jumps too quickly
      for (let i = 1; i < intensityProgression.length; i++) {
        if (intensityProgression[i] - intensityProgression[i-1] > 2) {
          warnings.push('Intensity progression may be too aggressive');
          break;
        }
      }
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }

  /**
   * Generate progression recommendations based on performance
   */
  static generateProgressionPlan(
    currentWorkout: WorkoutPrescription,
    userProfile: UserProfile,
    performanceMetrics?: {
      completionRate: number;
      averageRPE: number;
      heartRateCompliance: number;
    }
  ): string {
    const completion = performanceMetrics?.completionRate || 1.0;
    const rpe = performanceMetrics?.averageRPE || 6;
    const hrCompliance = performanceMetrics?.heartRateCompliance || 1.0;

    if (completion >= 0.95 && rpe <= 7 && hrCompliance >= 0.8) {
      // Ready to progress
      if (currentWorkout.machine_type === 'cardio') {
        return 'Increase duration by 5 minutes or intensity by one zone level next session';
      } else {
        return 'Increase weight by 2.5-5% or add one additional set next session';
      }
    } else if (completion < 0.8 || rpe >= 9) {
      // Need to reduce intensity
      return 'Reduce intensity or duration by 10-15% to improve recovery and form';
    } else {
      // Maintain current level
      return 'Maintain current workout parameters and focus on consistency';
    }
  }
}