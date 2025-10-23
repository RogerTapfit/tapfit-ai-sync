export interface HRSample {
  bpm: number;
  timestamp: number;
}

export interface RideSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  total_distance_m: number;
  moving_time_s: number;
  elapsed_time_s: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  calories: number;
  unit: 'km' | 'mi';
  notes?: string;
  elevation_gain_m?: number;
  elevation_loss_m?: number;
  source: 'gps';
  splits: RideSplit[];
  points: RidePoint[];
  auto_pause_enabled: boolean;
  audio_cues_enabled: boolean;
  
  // Heart Rate Training Fields
  training_mode?: string;
  target_hr_zone?: { min_bpm: number; max_bpm: number; zone_name: string };
  avg_heart_rate?: number;
  max_heart_rate?: number;
  time_in_zone_s?: number;
  hr_samples?: HRSample[];
  
  // Cycling-specific Fields
  avg_cadence?: number;
  ride_type?: 'road' | 'mountain' | 'indoor' | 'commute';
}

export interface RidePoint {
  lat: number;
  lon: number;
  timestamp: number;
  accuracy: number;
  altitude?: number;
  speed?: number; // m/s
  bearing?: number;
}

export interface RideSplit {
  index: number;
  distance_m: number; // cumulative
  duration_s: number;
  avg_speed_kmh: number;
  timestamp: number;
}

export interface RideSettings {
  unit: 'km' | 'mi';
  auto_pause: boolean;
  audio_cues: boolean;
  goal_type?: 'time' | 'distance' | 'heart_rate' | 'none';
  goal_value?: number;
  ride_type: 'road' | 'mountain' | 'indoor' | 'commute';
  
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

export interface RideMetrics {
  distance_m: number;
  elapsed_time_s: number;
  moving_time_s: number;
  current_speed_kmh: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
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

export type RideTrackerStatus = 'idle' | 'acquiring_gps' | 'ready' | 'countdown' | 'riding' | 'paused' | 'completed';
