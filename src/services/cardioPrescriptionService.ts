import { 
  CardioGoal, 
  CardioMachineType, 
  CardioUserProfile, 
  HeartRateZone, 
  WorkoutPrescription, 
  CardioBlock, 
  MachineSettings,
  AdaptiveRule,
  getZoneRange,
  calculateHRR
} from '@/types/cardio';
import { CardioEngineService } from './cardioEngineService';

export class CardioPrescriptionService {
  
  /**
   * Generate a complete cardio workout prescription
   */
  static generatePrescription(
    machineType: CardioMachineType,
    goal: CardioGoal,
    targetLoad: number, // TRIMP points
    targetZone: HeartRateZone,
    userProfile: CardioUserProfile,
    sessionDuration?: number // minutes, optional override
  ): WorkoutPrescription {
    
    const zoneRange = getZoneRange(targetZone);
    const targetHRR = (zoneRange.min + zoneRange.max) / 2;
    const targetMETs = CardioEngineService.estimateMETsFromHeartRate(targetHRR);
    
    // Generate workout plan based on goal
    const blocks = this.generateBlocks(goal, targetLoad, targetZone, sessionDuration);
    const initialSettings = CardioEngineService.translateMETsToSettings(
      machineType, 
      targetMETs, 
      userProfile
    );
    
    const totalDuration = blocks.reduce((sum, block) => sum + block.duration_min, 0);
    const estimatedCalories = this.estimateCaloriesBurned(blocks, targetMETs, userProfile.weight_kg);
    
    return {
      machine_type: machineType,
      total_duration: totalDuration,
      blocks,
      initial_settings: initialSettings,
      adaptive_rules: this.generateAdaptiveRules(machineType),
      progression_note: this.generateProgressionNote(goal, targetMETs, machineType),
      estimated_calories: estimatedCalories,
      target_trimp: targetLoad
    };
  }

  /**
   * Generate workout blocks based on goal type
   */
  private static generateBlocks(
    goal: CardioGoal,
    targetLoad: number,
    targetZone: HeartRateZone,
    duration?: number
  ): CardioBlock[] {
    
    switch (goal) {
      case 'endurance':
        return this.generateEnduranceBlocks(targetLoad, targetZone, duration);
      case 'calories':
        return this.generateCalorieBlocks(targetLoad, targetZone, duration);
      case 'intervals':
        return this.generateIntervalBlocks(targetZone);
      case 'recovery':
        return this.generateRecoveryBlocks(duration);
      default:
        return this.generateEnduranceBlocks(targetLoad, targetZone, duration);
    }
  }

  private static generateEnduranceBlocks(
    targetLoad: number,
    targetZone: HeartRateZone,
    duration?: number
  ): CardioBlock[] {
    const zoneRange = getZoneRange(targetZone);
    const zoneWeight = this.getZoneWeight(targetZone);
    const workDuration = duration || Math.ceil(targetLoad / zoneWeight);
    
    return [
      {
        id: '1',
        session_id: '',
        block_order: 1,
        duration_min: 5,
        target_hrr_min: 0.50,
        target_hrr_max: 0.60,
        machine_settings: {},
        block_type: 'warmup'
      },
      {
        id: '2',
        session_id: '',
        block_order: 2,
        duration_min: workDuration,
        target_hrr_min: zoneRange.min,
        target_hrr_max: zoneRange.max,
        machine_settings: {},
        block_type: 'work'
      },
      {
        id: '3',
        session_id: '',
        block_order: 3,
        duration_min: 5,
        target_hrr_min: 0.50,
        target_hrr_max: 0.60,
        machine_settings: {},
        block_type: 'cooldown'
      }
    ];
  }

  private static generateCalorieBlocks(
    targetCalories: number,
    targetZone: HeartRateZone,
    duration?: number
  ): CardioBlock[] {
    const zoneRange = getZoneRange(targetZone);
    // Estimate duration needed based on moderate intensity
    const estimatedDuration = duration || Math.ceil(targetCalories / 10); // ~10 cal/min estimate
    
    return [
      {
        id: '1',
        session_id: '',
        block_order: 1,
        duration_min: 5,
        target_hrr_min: 0.50,
        target_hrr_max: 0.60,
        machine_settings: {},
        block_type: 'warmup'
      },
      {
        id: '2',
        session_id: '',
        block_order: 2,
        duration_min: estimatedDuration,
        target_hrr_min: zoneRange.min,
        target_hrr_max: zoneRange.max,
        machine_settings: {},
        block_type: 'work'
      },
      {
        id: '3',
        session_id: '',
        block_order: 3,
        duration_min: 5,
        target_hrr_min: 0.50,
        target_hrr_max: 0.60,
        machine_settings: {},
        block_type: 'cooldown'
      }
    ];
  }

  private static generateIntervalBlocks(targetZone: HeartRateZone): CardioBlock[] {
    const blocks: CardioBlock[] = [];
    let blockId = 1;
    
    // Warmup
    blocks.push({
      id: blockId.toString(),
      session_id: '',
      block_order: blockId++,
      duration_min: 5,
      target_hrr_min: 0.50,
      target_hrr_max: 0.60,
      machine_settings: {},
      block_type: 'warmup'
    });
    
    // 6 x (2min Z4 + 2min Z2) intervals
    for (let i = 0; i < 6; i++) {
      // Work interval
      blocks.push({
        id: blockId.toString(),
        session_id: '',
        block_order: blockId++,
        duration_min: 2,
        target_hrr_min: 0.80,
        target_hrr_max: 0.90,
        machine_settings: {},
        block_type: 'work'
      });
      
      // Rest interval
      blocks.push({
        id: blockId.toString(),
        session_id: '',
        block_order: blockId++,
        duration_min: 2,
        target_hrr_min: 0.60,
        target_hrr_max: 0.70,
        machine_settings: {},
        block_type: 'rest'
      });
    }
    
    // Cooldown
    blocks.push({
      id: blockId.toString(),
      session_id: '',
      block_order: blockId++,
      duration_min: 5,
      target_hrr_min: 0.50,
      target_hrr_max: 0.60,
      machine_settings: {},
      block_type: 'cooldown'
    });
    
    return blocks;
  }

  private static generateRecoveryBlocks(duration?: number): CardioBlock[] {
    const workDuration = duration || 25;
    
    return [
      {
        id: '1',
        session_id: '',
        block_order: 1,
        duration_min: 5,
        target_hrr_min: 0.50,
        target_hrr_max: 0.60,
        machine_settings: {},
        block_type: 'warmup'
      },
      {
        id: '2',
        session_id: '',
        block_order: 2,
        duration_min: workDuration,
        target_hrr_min: 0.50,
        target_hrr_max: 0.65, // Easy Z1-Z2
        machine_settings: {},
        block_type: 'work'
      },
      {
        id: '3',
        session_id: '',
        block_order: 3,
        duration_min: 5,
        target_hrr_min: 0.50,
        target_hrr_max: 0.60,
        machine_settings: {},
        block_type: 'cooldown'
      }
    ];
  }

  /**
   * Generate adaptive control rules for real-time adjustment
   */
  private static generateAdaptiveRules(machineType: CardioMachineType): AdaptiveRule[] {
    return [
      {
        condition: 'hr_too_low',
        threshold: -0.03, // 3% below target HRR
        adjustment: this.getStandardAdjustment(machineType, 'increase')
      },
      {
        condition: 'hr_too_high',
        threshold: 0.03, // 3% above target HRR
        adjustment: this.getStandardAdjustment(machineType, 'decrease')
      },
      {
        condition: 'rpe_too_high',
        threshold: 9, // RPE scale 1-10
        adjustment: this.getStandardAdjustment(machineType, 'decrease')
      },
      {
        condition: 'safety_stop',
        threshold: 0.95, // 95% HRR for >60s
        adjustment: this.getStandardAdjustment(machineType, 'emergency_decrease')
      }
    ];
  }

  private static getStandardAdjustment(
    machineType: CardioMachineType,
    direction: 'increase' | 'decrease' | 'emergency_decrease'
  ) {
    const multiplier = direction === 'increase' ? 1 : direction === 'decrease' ? -1 : -2;
    
    switch (machineType) {
      case 'treadmill':
        return {
          speed_delta: multiplier * 0.2,
          incline_delta: multiplier * 0.5
        };
      case 'bike':
        return {
          watts_delta: multiplier * 10,
          level_delta: multiplier * 1
        };
      case 'stair_stepper':
        return {
          steps_delta: multiplier * 2,
          stepper_level_delta: multiplier * 1
        };
      default:
        return {
          level_delta: multiplier * 1
        };
    }
  }

  /**
   * Generate progression note for next session
   */
  private static generateProgressionNote(
    goal: CardioGoal,
    targetMETs: number,
    machineType: CardioMachineType
  ): string {
    switch (machineType) {
      case 'treadmill':
        return goal === 'intervals' 
          ? 'Next session: Add +0.2 km/h to interval speeds if RPE <7'
          : 'Next session: Add +0.5% incline if finish RPE ≤6';
      case 'bike':
        return 'Next session: Increase target watts by +5-10W if average RPE <7';
      case 'stair_stepper':
        return 'Next session: Add +2 steps/min or +1 level if HRR consistently <target';
      default:
        return 'Next session: Increase resistance by +1 level if session felt easy (RPE <6)';
    }
  }

  /**
   * Estimate calories burned for the workout
   */
  private static estimateCaloriesBurned(
    blocks: CardioBlock[], 
    avgMETs: number, 
    weightKg: number
  ): number {
    const totalMinutes = blocks.reduce((sum, block) => sum + block.duration_min, 0);
    const caloriesPerMin = CardioEngineService.calculateCaloriesPerMinute(avgMETs, weightKg);
    return Math.round(totalMinutes * caloriesPerMin);
  }

  /**
   * Get TRIMP zone weight for load calculations
   */
  private static getZoneWeight(zone: HeartRateZone): number {
    const weights = { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5 };
    
    if (zone.includes('-')) {
      const [z1, z2] = zone.split('-') as [HeartRateZone, HeartRateZone];
      return (weights[z1] + weights[z2]) / 2;
    }
    
    return weights[zone as keyof typeof weights] || 2;
  }

  /**
   * Quick prescription for common scenarios
   */
  static getQuickPrescription(
    machineType: CardioMachineType,
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
    duration: number = 30
  ): { goal: CardioGoal; targetZone: HeartRateZone; targetLoad: number } {
    
    const prescriptions = {
      beginner: { goal: 'recovery' as CardioGoal, targetZone: 'Z1' as HeartRateZone, targetLoad: 30 },
      intermediate: { goal: 'endurance' as CardioGoal, targetZone: 'Z2' as HeartRateZone, targetLoad: 60 },
      advanced: { goal: 'intervals' as CardioGoal, targetZone: 'Z3-Z4' as HeartRateZone, targetLoad: 100 }
    };
    
    return prescriptions[fitnessLevel];
  }
}