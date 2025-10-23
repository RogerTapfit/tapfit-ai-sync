import { SwimSession, SwimSettings, SwimMetrics, SwimTrackerStatus, SwimLap } from '@/types/swim';
import { swimStorageService } from './swimStorageService';

class SwimTrackerService {
  private session: SwimSession | null = null;
  private metrics: SwimMetrics = this.getInitialMetrics();
  private status: SwimTrackerStatus = 'idle';
  private listeners: Array<(metrics: SwimMetrics, status: SwimTrackerStatus) => void> = [];
  private timer: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private lapStartTime: number = 0;

  private getInitialMetrics(): SwimMetrics {
    return {
      distance_m: 0,
      elapsed_time_s: 0,
      moving_time_s: 0,
      current_pace_sec_per_100m: 0,
      avg_pace_sec_per_100m: 0,
      calories: 0,
      current_lap: 0,
      total_laps: 0,
      current_bpm: undefined,
      avg_bpm: undefined,
      time_in_zone_s: 0,
      zone_status: undefined,
    };
  }

  async initialize(userId: string, settings: SwimSettings): Promise<void> {
    this.session = {
      id: crypto.randomUUID(),
      user_id: userId,
      started_at: new Date().toISOString(),
      status: 'active',
      total_distance_m: 0,
      moving_time_s: 0,
      elapsed_time_s: 0,
      avg_pace_sec_per_100m: 0,
      calories: 0,
      unit: settings.unit,
      source: 'manual',
      laps: [],
      training_mode: settings.training_mode,
      target_hr_zone: settings.target_hr_zone,
      hr_samples: [],
      stroke_type: settings.stroke_type,
      pool_length_m: settings.pool_length_m,
      total_laps: 0,
    };

    this.metrics = this.getInitialMetrics();
    this.status = 'ready';
    this.notifyListeners();
  }

  start(): void {
    if (!this.session) return;
    
    this.status = 'swimming';
    this.session.status = 'active';
    this.startTime = Date.now();
    this.lapStartTime = Date.now();
    this.startTimer();
    this.notifyListeners();
  }

  pause(): void {
    if (!this.session) return;
    
    this.status = 'paused';
    this.session.status = 'paused';
    this.pausedTime = Date.now();
    this.stopTimer();
    this.notifyListeners();
  }

  resume(): void {
    if (!this.session) return;
    
    this.status = 'swimming';
    this.session.status = 'active';
    const pauseDuration = Date.now() - this.pausedTime;
    this.startTime += pauseDuration;
    this.lapStartTime += pauseDuration;
    this.startTimer();
    this.notifyListeners();
  }

  completeLap(): void {
    if (!this.session || this.status !== 'swimming') return;

    const now = Date.now();
    const lapDuration = (now - this.lapStartTime) / 1000;
    const poolLength = this.session.pool_length_m || 25;
    
    this.metrics.total_laps++;
    this.metrics.current_lap = this.metrics.total_laps;
    this.metrics.distance_m += poolLength;

    const avgPace = this.metrics.distance_m > 0 
      ? (this.metrics.moving_time_s / (this.metrics.distance_m / 100))
      : 0;

    const lap: SwimLap = {
      index: this.metrics.total_laps,
      distance_m: this.metrics.distance_m,
      duration_s: lapDuration,
      avg_pace_sec_per_100m: lapDuration / (poolLength / 100),
      timestamp: now,
    };

    this.session.laps.push(lap);
    this.session.total_distance_m = this.metrics.distance_m;
    this.session.total_laps = this.metrics.total_laps;
    this.session.avg_pace_sec_per_100m = avgPace;

    this.lapStartTime = now;
    this.notifyListeners();
  }

  updateHeartRate(bpm: number): void {
    if (!this.session) return;

    this.metrics.current_bpm = bpm;
    
    if (!this.session.hr_samples) {
      this.session.hr_samples = [];
    }
    
    this.session.hr_samples.push({
      bpm,
      timestamp: Date.now(),
    });

    const allBpms = this.session.hr_samples.map(s => s.bpm);
    this.metrics.avg_bpm = Math.round(allBpms.reduce((a, b) => a + b, 0) / allBpms.length);
    
    if (!this.session.max_heart_rate || bpm > this.session.max_heart_rate) {
      this.session.max_heart_rate = bpm;
    }

    if (this.session.target_hr_zone) {
      const { min_bpm, max_bpm } = this.session.target_hr_zone;
      if (bpm < min_bpm) {
        this.metrics.zone_status = 'below';
      } else if (bpm > max_bpm) {
        this.metrics.zone_status = 'above';
      } else {
        this.metrics.zone_status = 'in_zone';
        this.metrics.time_in_zone_s = (this.metrics.time_in_zone_s || 0) + 1;
      }
    }

    this.session.avg_heart_rate = this.metrics.avg_bpm;
    this.session.time_in_zone_s = this.metrics.time_in_zone_s;
    this.notifyListeners();
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateMetrics(): void {
    if (!this.session) return;

    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000;
    
    this.metrics.elapsed_time_s = elapsed;
    this.metrics.moving_time_s = elapsed;

    if (this.metrics.distance_m > 0) {
      this.metrics.avg_pace_sec_per_100m = this.metrics.moving_time_s / (this.metrics.distance_m / 100);
    }

    // Calculate calories (swimming burns ~400-700 cal/hour depending on intensity)
    this.metrics.calories = Math.round((this.metrics.moving_time_s / 3600) * 500);

    this.session.moving_time_s = this.metrics.moving_time_s;
    this.session.elapsed_time_s = this.metrics.elapsed_time_s;
    this.session.calories = this.metrics.calories;

    this.notifyListeners();
  }

  async complete(): Promise<string> {
    if (!this.session) throw new Error('No active session');

    this.stopTimer();
    this.session.status = 'completed';
    this.session.ended_at = new Date().toISOString();
    this.status = 'completed';

    await this.syncToSupabase();
    const sessionId = this.session.id;
    
    this.reset();
    return sessionId;
  }

  private async syncToSupabase(): Promise<void> {
    if (!this.session) return;
    await swimStorageService.saveSession(this.session);
  }

  abandon(): void {
    this.stopTimer();
    this.reset();
  }

  private reset(): void {
    this.session = null;
    this.metrics = this.getInitialMetrics();
    this.status = 'idle';
    this.startTime = 0;
    this.pausedTime = 0;
    this.lapStartTime = 0;
    this.notifyListeners();
  }

  getMetrics(): SwimMetrics {
    return { ...this.metrics };
  }

  getStatus(): SwimTrackerStatus {
    return this.status;
  }

  getSession(): SwimSession | null {
    return this.session ? { ...this.session } : null;
  }

  subscribe(callback: (metrics: SwimMetrics, status: SwimTrackerStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      callback(this.getMetrics(), this.getStatus());
    });
  }
}

export const swimTrackerService = new SwimTrackerService();
