import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
import { RunSession, RunPoint, RunSplit, RunSettings, RunMetrics, RunTrackerStatus, HRSample } from '@/types/run';
import { calculateDistance, calculateCalories, smoothElevation, calculateElevationChange } from '@/utils/runFormatters';
import { runStorageService } from './runStorageService';
import { supabase } from '@/integrations/supabase/client';
import { TapfitHealth } from '@/lib/tapfitHealth';
import { getZoneStatus, getCoachingCue } from '@/utils/heartRateZones';

type StateCallback = (metrics: RunMetrics, status: RunTrackerStatus) => void;

class RunTrackerService {
  private currentSession: RunSession | null = null;
  private watcherId: string | null = null;
  private webWatcherId: string | null = null; // For web GPS fallback
  private isNative: boolean = false;
  private status: RunTrackerStatus = 'idle';
  private callbacks: Set<StateCallback> = new Set();
  private lastPoint: RunPoint | null = null;
  private recentSpeeds: number[] = [];
  private pausedTime: number = 0;
  private pauseStartTime: number | null = null;
  private autoPauseTimer: NodeJS.Timeout | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  
  // Wall-clock timer for immediate start & sleep mode handling
  private sessionStartTime: number | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  
  // Heart Rate Monitoring
  private hrListener: any = null;
  private currentBPM: number | null = null;
  private hrSamples: HRSample[] = [];

  async initialize(): Promise<void> {
    await runStorageService.init();
    
    // On web, permissions are requested automatically when calling watchPosition
    // Only check/request permissions on native platforms
    if (Capacitor.isNativePlatform()) {
      const status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        const result = await Geolocation.requestPermissions();
        if (result.location !== 'granted') {
          throw new Error('Location permission denied. GPS tracking requires location access.');
        }
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
      
      // Heart Rate Training
      training_mode: settings.training_mode || 'pace_based',
      target_hr_zone: settings.target_hr_zone,
      hr_samples: [],
    };

    // Start HR monitoring if training mode requires it
    if (settings.training_mode && settings.training_mode !== 'pace_based') {
      await this.startHeartRateMonitoring();
    }

    // Save initial session
    await runStorageService.saveSession(this.currentSession);

    // Detect platform for GPS method selection
    this.isNative = Capacitor.isNativePlatform();
    console.log(`📍 Starting GPS tracking (platform: ${this.isNative ? 'native' : 'web'})`);

    if (this.isNative) {
      // Native: Use background geolocation for background tracking support
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
    } else {
      // Web: Use standard Geolocation API (works on WiFi, 5G, LTE)
      console.log('🌐 Using web geolocation API for GPS tracking');
      this.webWatcherId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            console.error('📍 Web GPS error:', err);
            return;
          }
          if (position) {
            this.handleLocationUpdate({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              timestamp: position.timestamp,
              accuracy: position.coords.accuracy ?? 100,
              altitude: position.coords.altitude ?? undefined,
              speed: position.coords.speed ?? undefined,
              bearing: position.coords.heading ?? undefined,
            });
          }
        }
      );
    }

    this.status = 'running';
    
    // Start wall-clock timer immediately (doesn't wait for GPS)
    this.sessionStartTime = Date.now();
    this.pausedTime = 0;
    this.startWallClockTimer();
    
    // Request wake lock to keep screen on during workout (web only)
    this.requestWakeLock();
    
    // Add visibility change listener for sleep mode handling
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    this.startAutoSave();
    this.notifyListeners();

    return sessionId;
  }
  
  private startWallClockTimer(): void {
    // Timer ticks every second based on wall-clock time
    this.timerInterval = setInterval(() => {
      if (this.currentSession && this.status === 'running' && this.sessionStartTime) {
        const now = Date.now();
        const totalElapsed = (now - this.sessionStartTime) / 1000;
        this.currentSession.elapsed_time_s = Math.max(0, totalElapsed - this.pausedTime);
        
        // If auto-pause is off, moving time = elapsed time
        if (!this.currentSession.auto_pause_enabled) {
          this.currentSession.moving_time_s = this.currentSession.elapsed_time_s;
        }
        
        // Recalculate metrics based on new time
        this.updateMetrics();
        this.notifyListeners();
      }
    }, 1000);
  }
  
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.status === 'running' && this.sessionStartTime && this.currentSession) {
      // App came back to foreground - recalculate time from wall clock
      const now = Date.now();
      const totalElapsed = (now - this.sessionStartTime) / 1000;
      this.currentSession.elapsed_time_s = Math.max(0, totalElapsed - this.pausedTime);
      
      if (!this.currentSession.auto_pause_enabled) {
        this.currentSession.moving_time_s = this.currentSession.elapsed_time_s;
      }
      
      this.updateMetrics();
      this.notifyListeners();
      console.log('📱 App resumed - timer recalculated from wall clock');
    }
  };
  
  private async requestWakeLock(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('🔒 Wake lock acquired - screen will stay on');
        
        // Re-acquire wake lock if released (e.g., tab switch)
        this.wakeLock.addEventListener('release', () => {
          console.log('🔓 Wake lock released');
        });
      } catch (err) {
        console.log('Wake lock not available:', err);
      }
    }
  }

  private handleLocationUpdate(point: RunPoint): void {
    if (!this.currentSession || this.status !== 'running') return;

    // Filter poor accuracy points - more lenient on web (cell tower triangulation can be 50-150m)
    const maxAccuracy = this.isNative ? 50 : 150;
    if (point.accuracy > maxAccuracy) {
      console.log(`📍 Skipping low accuracy point: ${point.accuracy}m (max: ${maxAccuracy}m)`);
      return;
    }

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
    this.pauseStartTime = Date.now(); // Track when pause started for wall-clock calculation
    if (this.currentSession) {
      this.currentSession.status = 'paused';
      await runStorageService.saveSession(this.currentSession);
    }
    this.notifyListeners();
  }

  async resumeTracking(): Promise<void> {
    if (this.status !== 'paused') return;
    
    // Add paused duration to total paused time
    if (this.pauseStartTime) {
      this.pausedTime += (Date.now() - this.pauseStartTime) / 1000;
      this.pauseStartTime = null;
    }
    
    this.status = 'running';
    if (this.currentSession) {
      this.currentSession.status = 'active';
      await runStorageService.saveSession(this.currentSession);
    }
    this.notifyListeners();
  }

  async stopTracking(): Promise<RunSession | null> {
    if (!this.currentSession) return null;

    // Stop wall-clock timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Remove visibility change listener
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    // Release wake lock
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('🔓 Wake lock released');
      } catch (err) {
        console.log('Error releasing wake lock:', err);
      }
    }

    // Stop GPS watcher - handle both native and web
    if (this.isNative && this.watcherId) {
      await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
      this.watcherId = null;
    } else if (this.webWatcherId) {
      await Geolocation.clearWatch({ id: this.webWatcherId });
      this.webWatcherId = null;
    }

    // Stop auto-save
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }

    // Stop HR monitoring
    if (this.hrListener) {
      this.hrListener.remove();
      await TapfitHealth.stopWorkout();
      this.hrListener = null;
    }

    // Finalize session
    this.currentSession.ended_at = new Date().toISOString();
    this.currentSession.status = 'completed';
    await runStorageService.saveSession(this.currentSession);

    // Sync to Supabase
    await this.syncToSupabase(this.currentSession);

    const session = this.currentSession;
    this.currentSession = null;
    this.lastPoint = null;
    this.recentSpeeds = [];
    this.hrSamples = [];
    this.currentBPM = null;
    this.sessionStartTime = null;
    this.pausedTime = 0;
    this.status = 'idle';
    this.notifyListeners();

    return session;
  }

  private async syncToSupabase(session: RunSession): Promise<void> {
    try {
      const { error } = await supabase.from('run_sessions').upsert({
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
        route_points: session.points as any,
        splits: session.splits as any,
        
        // Heart Rate Data
        training_mode: session.training_mode,
        target_hr_zone: session.target_hr_zone as any,
        avg_heart_rate: session.avg_heart_rate,
        max_heart_rate: session.max_heart_rate,
        time_in_zone_s: session.time_in_zone_s,
        hr_samples: session.hr_samples as any,
      });

      if (error) {
        console.error('Failed to sync session to Supabase:', error);
        throw error;
      }
      
      console.log('✅ Run successfully synced to Supabase:', session.id);
    } catch (error) {
      console.error('Sync error:', error);
      // Don't throw - we still have local copy in IndexedDB
    }
  }

  private async startHeartRateMonitoring(): Promise<void> {
    try {
      console.log('🫀 Starting HR monitoring...');
      
      // Start Apple Watch workout
      const activityType = this.currentSession?.training_mode === 'steady_jog' ? 'walking' : 'running';
      await TapfitHealth.startWorkout({ activityType });

      // Listen for HR updates
      this.hrListener = await TapfitHealth.addListener('heartRate', ({ bpm, timestamp }) => {
        this.currentBPM = Math.round(bpm);
        
        // Store HR sample
        this.hrSamples.push({ bpm: this.currentBPM, timestamp });
        
        // Update session with HR data
        if (this.currentSession) {
          this.currentSession.hr_samples = this.hrSamples;
          this.updateHRMetrics();
        }

        // Check zone status and provide coaching
        if (this.currentSession?.target_hr_zone) {
          const zoneStatus = getZoneStatus(this.currentBPM, this.currentSession.target_hr_zone);
          this.provideHRCoaching(zoneStatus);
        }
      });

      console.log('✅ HR monitoring started');
    } catch (error) {
      console.error('❌ Failed to start HR monitoring:', error);
    }
  }

  private updateHRMetrics(): void {
    if (!this.currentSession || this.hrSamples.length === 0) return;

    // Calculate average HR
    const avgBPM = Math.round(
      this.hrSamples.reduce((sum, s) => sum + s.bpm, 0) / this.hrSamples.length
    );

    // Calculate max HR
    const maxBPM = Math.max(...this.hrSamples.map(s => s.bpm));

    // Calculate time in target zone
    let timeInZone = 0;
    if (this.currentSession.target_hr_zone) {
      const zone = this.currentSession.target_hr_zone;
      timeInZone = this.hrSamples.filter(
        s => s.bpm >= zone.min_bpm && s.bpm <= zone.max_bpm
      ).length * 5; // Assuming ~5s per sample
    }

    this.currentSession.avg_heart_rate = avgBPM;
    this.currentSession.max_heart_rate = maxBPM;
    this.currentSession.time_in_zone_s = timeInZone;
  }

  private provideHRCoaching(zoneStatus: 'below' | 'in_zone' | 'above'): void {
    if (!this.currentSession?.audio_cues_enabled) return;

    // Haptic feedback
    if (zoneStatus === 'in_zone') {
      Haptics.impact({ style: ImpactStyle.Light });
    } else {
      Haptics.impact({ style: ImpactStyle.Medium });
    }

    // Log coaching cue (could add text-to-speech in future)
    const cue = getCoachingCue(zoneStatus);
    console.log('🫀 HR Coaching:', cue);
  }

  getState(): { metrics: RunMetrics; status: RunTrackerStatus; session: RunSession | null } | null {
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
      
      // Heart Rate Metrics
      current_bpm: this.currentBPM,
      avg_bpm: this.currentSession.avg_heart_rate,
      time_in_zone_s: this.currentSession.time_in_zone_s,
      zone_status: this.currentSession.target_hr_zone && this.currentBPM
        ? getZoneStatus(this.currentBPM, this.currentSession.target_hr_zone)
        : undefined,
    };

    return { metrics, status: this.status, session: this.currentSession };
  }

  // Expose service globally for map component to access session
  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__runTrackerService = this;
    }
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
