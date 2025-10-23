export interface HRSample {
  bpm: number;
  timestamp: number;
}

export interface RunSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  total_distance_m: number;
  moving_time_s: number;
  elapsed_time_s: number;
  avg_pace_sec_per_km: number;
  calories: number;
  unit: 'km' | 'mi';
  notes?: string;
  elevation_gain_m?: number;
  elevation_loss_m?: number;
  source: 'gps';
  splits: RunSplit[];
  points: RunPoint[];
  auto_pause_enabled: boolean;
  audio_cues_enabled: boolean;
  
  // Heart Rate Training Fields
  training_mode?: string;
  target_hr_zone?: { min_bpm: number; max_bpm: number; zone_name: string };
  avg_heart_rate?: number;
  max_heart_rate?: number;
  time_in_zone_s?: number;
  hr_samples?: HRSample[];
}

export interface RunPoint {
  lat: number;
  lon: number;
  timestamp: number; // ms since epoch
  accuracy: number; // meters
  altitude?: number;
  speed?: number; // m/s
  bearing?: number;
}

export interface RunSplit {
  index: number;
  distance_m: number; // cumulative distance at split
  duration_s: number; // time for this split
  avg_pace_sec_per_km: number;
  timestamp: number;
}

export interface RunSettings {
  unit: 'km' | 'mi';
  auto_pause: boolean;
  audio_cues: boolean;
  goal_type?: 'time' | 'distance' | 'heart_rate' | 'none';
  goal_value?: number;
  
  // Heart Rate Training Settings
  training_mode?: 'pace_based' | 'steady_jog' | 'steady_run' | 'intervals' | 'hr_zone_custom';
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

export interface RunMetrics {
  distance_m: number;
  elapsed_time_s: number;
  moving_time_s: number;
  current_pace_sec_per_km: number;
  avg_pace_sec_per_km: number;
  calories: number;
  current_split?: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
  gps_accuracy: number;
  
  // Heart Rate Metrics
  current_bpm?: number;
  avg_bpm?: number;
  time_in_zone_s?: number;
  zone_status?: 'below' | 'in_zone' | 'above';
}

export type RunTrackerStatus = 'idle' | 'acquiring_gps' | 'ready' | 'countdown' | 'running' | 'paused' | 'completed';
