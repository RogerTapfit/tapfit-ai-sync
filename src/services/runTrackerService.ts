import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
import { RunSession, RunPoint, RunSplit, RunSettings, RunMetrics, RunTrackerStatus } from '@/types/run';
import { calculateDistance, calculateCalories, smoothElevation, calculateElevationChange } from '@/utils/runFormatters';
import { runStorageService } from './runStorageService';
import { supabase } from '@/integrations/supabase/client';

type StateCallback = (metrics: RunMetrics, status: RunTrackerStatus) => void;

class RunTrackerService {
  private currentSession: RunSession | null = null;
  private watcherId: string | null = null;
  private status: RunTrackerStatus = 'idle';
  private callbacks: Set<StateCallback> = new Set();
  private lastPoint: RunPoint | null = null;
  private recentSpeeds: number[] = [];
  private pausedTime: number = 0;
  private pauseStartTime: number | null = null;
  private autoPauseTimer: NodeJS.Timeout | null = null;
  private saveTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    await runStorageService.init();
    
    // Check permissions
    const status = await Geolocation.checkPermissions();
    if (status.location !== 'granted') {
      // Request permissions - on iOS this will show the system dialog
      const result = await Geolocation.requestPermissions();
      if (result.location !== 'granted') {
        throw new Error('Location permission denied. GPS tracking requires location access.');
      }
    }
  }

  async startTracking(settings: RunSettings, userId: string): Promise<string> {
    await this.initialize();

    // Create new session
    const sessionId = `run_${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      user_id: userId,
      started_at: new Date().toISOString(),
      status: 'active',
      total_distance_m: 0,
      moving_time_s: 0,
      elapsed_time_s: 0,
      avg_pace_sec_per_km: 0,
      calories: 0,
      unit: settings.unit,
      source: 'gps',
      splits: [],
      points: [],
      auto_pause_enabled: settings.auto_pause,
      audio_cues_enabled: settings.audio_cues,
      elevation_gain_m: 0,
      elevation_loss_m: 0,
    };

    // Save initial session
    await runStorageService.saveSession(this.currentSession);

    // Start GPS tracking with optimizations
    this.watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: 'TapFit is tracking your run',
        backgroundTitle: 'Run Tracking Active',
        requestPermissions: true,
        stale: false,
        distanceFilter: 5, // Update every 5 meters for better accuracy and battery efficiency
      },
      (location) => {
        this.handleLocationUpdate({
          lat: location.latitude,
          lon: location.longitude,
          timestamp: location.time || Date.now(),
          accuracy: location.accuracy || 50,
          altitude: location.altitude,
          speed: location.speed,
          bearing: location.bearing,
        });
      }
    );

    this.status = 'running';
    this.startAutoSave();
    this.notifyListeners();

    return sessionId;
  }

  private handleLocationUpdate(point: RunPoint): void {
    if (!this.currentSession || this.status !== 'running') return;

    // Filter poor accuracy points
    if (point.accuracy > 50) return;

    // Filter unrealistic speeds (>6 m/s = ~13.4 mph)
    if (point.speed && point.speed > 6) return;

    // Add point to session
    this.currentSession.points.push(point);

    // Calculate distance if we have a previous point
    if (this.lastPoint) {
      const distance = calculateDistance(this.lastPoint, point);
      this.currentSession.total_distance_m += distance;

      // Update elapsed time
      const timeDelta = (point.timestamp - this.lastPoint.timestamp) / 1000;
      this.currentSession.elapsed_time_s += timeDelta;

      // Track speed for auto-pause
      if (point.speed !== undefined) {
        this.recentSpeeds.push(point.speed);
        if (this.recentSpeeds.length > 10) this.recentSpeeds.shift();
      }

      // Check auto-pause
      if (this.currentSession.auto_pause_enabled) {
        this.checkAutoPause();
      } else {
        this.currentSession.moving_time_s += timeDelta;
      }

      // Check for splits
      this.checkSplitTrigger();
    }

    this.lastPoint = point;
    this.updateMetrics();
    this.notifyListeners();
  }

  private checkAutoPause(): void {
    const avgSpeed = this.recentSpeeds.reduce((a, b) => a + b, 0) / this.recentSpeeds.length;

    if (avgSpeed < 0.5 && !this.pauseStartTime) {
      // Start pause
      this.pauseStartTime = Date.now();
    } else if (avgSpeed > 1.5 && this.pauseStartTime) {
      // Resume
      this.pausedTime += (Date.now() - this.pauseStartTime) / 1000;
      this.pauseStartTime = null;
    } else if (!this.pauseStartTime && this.lastPoint) {
      // Moving - count time
      this.currentSession!.moving_time_s += (Date.now() - this.lastPoint.timestamp) / 1000;
    }
  }

  private checkSplitTrigger(): void {
    if (!this.currentSession) return;

    const splitDistance = this.currentSession.unit === 'km' ? 1000 : 1609.34;
    const currentSplitIndex = Math.floor(this.currentSession.total_distance_m / splitDistance);

    if (currentSplitIndex > this.currentSession.splits.length) {
      const splitTime = this.currentSession.moving_time_s;
      const lastSplitTime = this.currentSession.splits.length > 0 
        ? this.currentSession.splits[this.currentSession.splits.length - 1].duration_s 
        : 0;

      const split: RunSplit = {
        index: currentSplitIndex,
        distance_m: this.currentSession.total_distance_m,
        duration_s: splitTime - lastSplitTime,
        avg_pace_sec_per_km: ((splitTime - lastSplitTime) / (splitDistance / 1000)),
        timestamp: Date.now(),
      };

      this.currentSession.splits.push(split);
      runStorageService.saveSplit(this.currentSession.id, split);

      if (this.currentSession.audio_cues_enabled) {
        Haptics.impact({ style: ImpactStyle.Medium });
      }
    }
  }

  private updateMetrics(): void {
    if (!this.currentSession) return;

    const distance = this.currentSession.total_distance_m;
    const movingTime = this.currentSession.moving_time_s;

    if (movingTime > 0 && distance > 0) {
      this.currentSession.avg_pace_sec_per_km = (movingTime / (distance / 1000));
      this.currentSession.calories = calculateCalories(distance, movingTime);
    }

    // Calculate elevation
    if (this.currentSession.points.length > 10) {
      const smoothed = smoothElevation(this.currentSession.points);
      const { gain, loss } = calculateElevationChange(smoothed);
      this.currentSession.elevation_gain_m = gain;
      this.currentSession.elevation_loss_m = loss;
    }
  }

  private startAutoSave(): void {
    this.saveTimer = setInterval(() => {
      if (this.currentSession) {
        runStorageService.saveSession(this.currentSession);
      }
    }, 10000); // Save every 10 seconds
  }

  async pauseTracking(): Promise<void> {
    if (this.status !== 'running') return;
    this.status = 'paused';
    if (this.currentSession) {
      this.currentSession.status = 'paused';
      await runStorageService.saveSession(this.currentSession);
    }
    this.notifyListeners();
  }

  async resumeTracking(): Promise<void> {
    if (this.status !== 'paused') return;
    this.status = 'running';
    if (this.currentSession) {
      this.currentSession.status = 'active';
      await runStorageService.saveSession(this.currentSession);
    }
    this.notifyListeners();
  }

  async stopTracking(): Promise<RunSession | null> {
    if (!this.currentSession) return null;

    // Stop GPS watcher
    if (this.watcherId) {
      await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
      this.watcherId = null;
    }

    // Stop auto-save
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }

    // Finalize session
    this.currentSession.ended_at = new Date().toISOString();
    this.currentSession.status = 'completed';
    await runStorageService.saveSession(this.currentSession);

    // Sync to Supabase (TODO: Enable after database migration)
    // await this.syncToSupabase(this.currentSession);

    const session = this.currentSession;
    this.currentSession = null;
    this.lastPoint = null;
    this.recentSpeeds = [];
    this.status = 'idle';
    this.notifyListeners();

    return session;
  }

  private async syncToSupabase(session: RunSession): Promise<void> {
    // TODO: Enable after database migration creates run_sessions table
    console.log('Sync to Supabase disabled until migration', session.id);
    /*
    try {
      const { error } = await supabase.from('run_sessions').insert({
        id: session.id,
        user_id: session.user_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        status: session.status,
        total_distance_m: session.total_distance_m,
        moving_time_s: session.moving_time_s,
        elapsed_time_s: session.elapsed_time_s,
        avg_pace_sec_per_km: session.avg_pace_sec_per_km,
        calories: session.calories,
        unit: session.unit,
        elevation_gain_m: session.elevation_gain_m,
        elevation_loss_m: session.elevation_loss_m,
      });

      if (error) console.error('Failed to sync session:', error);
    } catch (error) {
      console.error('Sync error:', error);
    }
    */
  }

  getState(): { metrics: RunMetrics; status: RunTrackerStatus } | null {
    if (!this.currentSession) return null;

    const metrics: RunMetrics = {
      distance_m: this.currentSession.total_distance_m,
      elapsed_time_s: this.currentSession.elapsed_time_s,
      moving_time_s: this.currentSession.moving_time_s,
      current_pace_sec_per_km: this.calculateCurrentPace(),
      avg_pace_sec_per_km: this.currentSession.avg_pace_sec_per_km,
      calories: this.currentSession.calories,
      current_split: this.currentSession.splits.length,
      elevation_gain_m: this.currentSession.elevation_gain_m || 0,
      elevation_loss_m: this.currentSession.elevation_loss_m || 0,
      gps_accuracy: this.lastPoint?.accuracy || 0,
    };

    return { metrics, status: this.status };
  }

  private calculateCurrentPace(): number {
    if (this.currentSession && this.currentSession.points.length > 10) {
      const recentPoints = this.currentSession.points.slice(-10);
      const distance = recentPoints.slice(1).reduce((sum, point, i) => 
        sum + calculateDistance(recentPoints[i], point), 0
      );
      const time = (recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp) / 1000;
      if (time > 0 && distance > 0) {
        return time / (distance / 1000);
      }
    }
    return this.currentSession?.avg_pace_sec_per_km || 0;
  }

  subscribe(callback: StateCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getState();
    if (state) {
      this.callbacks.forEach(cb => cb(state.metrics, state.status));
    }
  }
}

export const runTrackerService = new RunTrackerService();
