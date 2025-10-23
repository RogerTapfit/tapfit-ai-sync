export interface HRSample {
  bpm: number;
  timestamp: number;
}

export interface SwimSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  total_distance_m: number;
  moving_time_s: number;
  elapsed_time_s: number;
  avg_pace_sec_per_100m: number;
  calories: number;
  unit: 'yd' | 'm';
  notes?: string;
  source: 'manual';
  laps: SwimLap[];
  
  // Heart Rate Training Fields
  training_mode?: string;
  target_hr_zone?: { min_bpm: number; max_bpm: number; zone_name: string };
  avg_heart_rate?: number;
  max_heart_rate?: number;
  time_in_zone_s?: number;
  hr_samples?: HRSample[];
  
  // Swimming-specific Fields
  stroke_type?: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';
  pool_length_m?: number;
  total_laps?: number;
  avg_strokes_per_lap?: number;
  swolf_score?: number;
}

export interface SwimLap {
  index: number;
  distance_m: number; // cumulative
  duration_s: number;
  avg_pace_sec_per_100m: number;
  timestamp: number;
  strokes?: number;
}

export interface SwimSettings {
  unit: 'yd' | 'm';
  audio_cues: boolean;
  goal_type?: 'time' | 'distance' | 'heart_rate' | 'laps' | 'none';
  goal_value?: number;
  stroke_type: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';
  pool_length_m: number;
  
  // Heart Rate Training Settings
  training_mode?: 'pace_based' | 'zone2_endurance' | 'zone3_tempo' | 'intervals' | 'recovery' | 'hr_zone_custom';
  target_hr_zone?: {
    min_bpm: number;
    max_bpm: number;
    zone_name: string;
  };
  interval_config?: {
    work_zone: { min_bpm: number; max_bpm: number };
    recovery_zone: { min_bpm: number; max_bpm: number };
    work_duration_s?: number;
    recovery_duration_s?: number;
  };
}

export interface SwimMetrics {
  distance_m: number;
  elapsed_time_s: number;
  moving_time_s: number;
  current_pace_sec_per_100m: number;
  avg_pace_sec_per_100m: number;
  calories: number;
  current_lap?: number;
  total_laps: number;
  
  // Heart Rate Metrics
  current_bpm?: number;
  avg_bpm?: number;
  time_in_zone_s?: number;
  zone_status?: 'below' | 'in_zone' | 'above';
}

export type SwimTrackerStatus = 'idle' | 'ready' | 'countdown' | 'swimming' | 'paused' | 'completed';
