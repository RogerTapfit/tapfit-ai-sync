export interface CardioUserProfile {
  age: number;
  sex: 'male' | 'female';
  weight_kg: number;
  HR_rest: number;
  HR_max: number; // 208 - 0.7 * age
  FTP_w?: number; // Functional Threshold Power for cycling
  vVO2max?: number; // Velocity at VO2max for treadmill
}

export interface CardioSession {
  id: string;
  user_id: string;
  machine_type: CardioMachineType;
  goal: CardioGoal;
  target_load: number; // TRIMP points
  target_zone: HeartRateZone;
  planned_duration: number; // minutes
  actual_duration?: number;
  created_at: string;
  completed_at?: string;
}

export interface CardioBlock {
  id: string;
  session_id: string;
  block_order: number;
  duration_min: number;
  target_hrr_min: number; // Heart Rate Reserve %
  target_hrr_max: number;
  machine_settings: MachineSettings;
  block_type: 'warmup' | 'work' | 'rest' | 'cooldown';
}

export interface SessionRecording {
  id: string;
  session_id: string;
  duration_min: number;
  distance?: number;
  elevation_gain?: number;
  avg_speed?: number;
  avg_level?: number;
  hr_avg: number;
  hr_max: number;
  cadence_avg?: number;
  watts_avg?: number;
  rpe: number; // Rate of Perceived Exertion 1-10
  trimp_score: number;
  calories_burned: number;
  time_in_zones: ZoneDistribution;
}

export interface ZoneDistribution {
  z1_minutes: number; // 50-60% HRR
  z2_minutes: number; // 60-70% HRR
  z3_minutes: number; // 70-80% HRR
  z4_minutes: number; // 80-90% HRR
  z5_minutes: number; // 90-100% HRR
}

export interface MachineCalibration {
  id: string;
  machine_id: string;
  machine_type: CardioMachineType;
  calibration_constant: number; // k_machine for METs calculations
  last_updated: string;
  session_count: number;
  accuracy_score: number;
}

export type CardioMachineType = 
  | 'treadmill' 
  | 'bike' 
  | 'stair_stepper' 
  | 'elliptical' 
  | 'rower';

export type CardioGoal = 
  | 'endurance' 
  | 'calories' 
  | 'intervals' 
  | 'recovery';

export type HeartRateZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5' | 'Z2-Z3' | 'Z3-Z4';

export interface MachineSettings {
  // Treadmill
  speed_kmh?: number;
  incline_pct?: number;
  
  // Bike
  watts?: number;
  resistance_level?: number;
  
  // Stair Stepper
  steps_per_min?: number;
  level?: number;
  
  // Elliptical/Rower
  resistance?: number;
  stroke_rate?: number;
}

export interface HeartRateTarget {
  hrr_min: number; // Heart Rate Reserve %
  hrr_max: number;
  hr_bpm_min: number; // Absolute heart rate
  hr_bpm_max: number;
}

export interface WorkoutPrescription {
  machine_type: CardioMachineType;
  total_duration: number;
  blocks: CardioBlock[];
  initial_settings: MachineSettings;
  adaptive_rules: AdaptiveRule[];
  progression_note: string;
  estimated_calories: number;
  target_trimp: number;
}

export interface AdaptiveRule {
  condition: 'hr_too_low' | 'hr_too_high' | 'rpe_too_high' | 'safety_stop';
  threshold: number;
  adjustment: MachineAdjustment;
}

export interface MachineAdjustment {
  // Treadmill adjustments
  speed_delta?: number; // ±0.2 km/h
  incline_delta?: number; // ±0.5%
  
  // Bike adjustments  
  watts_delta?: number; // ±10W
  level_delta?: number; // ±1
  
  // Stepper adjustments
  steps_delta?: number; // ±2 steps/min
  stepper_level_delta?: number; // ±1
}

export interface ProgressionMetrics {
  weekly_trimp_load: number;
  seven_day_avg_trimp: number;
  fatigue_ratio: number; // yesterday_trimp / 7day_avg
  last_session_rpe: number;
  progression_readiness: 'ready' | 'maintain' | 'deload';
}

// Heart Rate Reserve calculation utilities
export const calculateHRR = (hr_current: number, hr_rest: number, hr_max: number): number => {
  return (hr_current - hr_rest) / (hr_max - hr_rest);
};

export const getZoneRange = (zone: HeartRateZone): { min: number; max: number } => {
  const zones = {
    Z1: { min: 0.50, max: 0.60 },
    Z2: { min: 0.60, max: 0.70 },
    Z3: { min: 0.70, max: 0.80 },
    Z4: { min: 0.80, max: 0.90 },
    Z5: { min: 0.90, max: 1.00 },
    'Z2-Z3': { min: 0.60, max: 0.80 },
    'Z3-Z4': { min: 0.70, max: 0.90 }
  };
  return zones[zone];
};

export const calculateTRIMP = (timeInZones: ZoneDistribution): number => {
  const zoneWeights = [1, 2, 3, 4, 5];
  return (
    timeInZones.z1_minutes * zoneWeights[0] +
    timeInZones.z2_minutes * zoneWeights[1] +
    timeInZones.z3_minutes * zoneWeights[2] +
    timeInZones.z4_minutes * zoneWeights[3] +
    timeInZones.z5_minutes * zoneWeights[4]
  );
};