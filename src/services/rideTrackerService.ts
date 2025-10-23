import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { RideSession, RideSettings, RideMetrics, RideTrackerStatus, RidePoint, RideSplit } from '@/types/ride';
import { rideStorageService } from './rideStorageService';
import { supabase } from '@/integrations/supabase/client';
import { TapfitHealth } from '@/lib/tapfitHealth';
import { calculateCyclingCalories, metersPerSecondToSpeed } from '@/utils/cyclingMetrics';

type StateCallback = (metrics: RideMetrics, status: RideTrackerStatus) => void;

class RideTrackerService {
  private currentSession: RideSession | null = null;
  private status: RideTrackerStatus = 'idle';
  private watchId: string | null = null;
  private lastPoint: RidePoint | null = null;
  private autoSaveInterval: number | null = null;
  private listeners: Set<StateCallback> = new Set();
  private hrListener: any = null;
  private currentHR: number | null = null;

  async initialize() {
    const permissions = await Geolocation.checkPermissions();
    if (permissions.location !== 'granted') {
      const request = await Geolocation.requestPermissions();
      if (request.location !== 'granted') {
        throw new Error('Location permission denied');
      }
    }
  }

  async startTracking(settings: RideSettings, userId: string): Promise<string> {
    await this.initialize();

    const sessionId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      user_id: userId,
      started_at: new Date().toISOString(),
      status: 'active',
      total_distance_m: 0,
      moving_time_s: 0,
      elapsed_time_s: 0,
      avg_speed_kmh: 0,
      max_speed_kmh: 0,
      calories: 0,
      unit: settings.unit,
      source: 'gps',
      splits: [],
      points: [],
      auto_pause_enabled: settings.auto_pause,
      audio_cues_enabled: settings.audio_cues,
      training_mode: settings.training_mode,
      target_hr_zone: settings.target_hr_zone,
      ride_type: settings.ride_type,
      elevation_gain_m: 0,
      elevation_loss_m: 0,
      hr_samples: [],
    };

    this.status = 'acquiring_gps';
    this.notifyListeners();

    // Start heart rate monitoring if HR training mode
    if (settings.training_mode && settings.training_mode !== 'pace_based') {
      await this.startHeartRateMonitoring();
    }

    // Start GPS tracking
    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      (position, err) => {
        if (err) {
          console.error('GPS error:', err);
          return;
        }
        if (position) {
          const point: RidePoint = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            speed: position.coords.speed ?? undefined,
            bearing: position.coords.heading ?? undefined,
          };
          this.handleLocationUpdate(point);
        }
      }
    );

    // Auto-save every 10 seconds
    this.autoSaveInterval = window.setInterval(() => {
      if (this.currentSession) {
        rideStorageService.saveCurrentRide(this.currentSession);
      }
    }, 10000);

    rideStorageService.saveCurrentRide(this.currentSession);
    return sessionId;
  }

  private handleLocationUpdate(point: RidePoint) {
    if (!this.currentSession || this.status === 'paused') return;

    if (this.status === 'acquiring_gps' && point.accuracy < 20) {
      this.status = 'riding';
    }

    this.currentSession.points.push(point);

    if (this.lastPoint) {
      const distance = this.calculateDistance(
        this.lastPoint.lat,
        this.lastPoint.lon,
        point.lat,
        point.lon
      );

      const timeDiff = (point.timestamp - this.lastPoint.timestamp) / 1000;
      const speedKmh = point.speed ? metersPerSecondToSpeed(point.speed, 'km') : (distance / timeDiff) * 3.6;

      // Auto-pause logic for cycling (below 3 km/h)
      if (this.currentSession.auto_pause_enabled && speedKmh < 3 && this.status === 'riding') {
        return; // Don't update metrics during auto-pause
      }

      if (this.status === 'riding') {
        this.currentSession.total_distance_m += distance;
        this.currentSession.moving_time_s += timeDiff;
        this.currentSession.elapsed_time_s += timeDiff;

        if (speedKmh > this.currentSession.max_speed_kmh) {
          this.currentSession.max_speed_kmh = speedKmh;
        }

        // Calculate average speed
        if (this.currentSession.moving_time_s > 0) {
          this.currentSession.avg_speed_kmh = 
            (this.currentSession.total_distance_m / 1000) / (this.currentSession.moving_time_s / 3600);
        }

        // Update calories
        this.currentSession.calories = calculateCyclingCalories(
          this.currentSession.moving_time_s / 60,
          this.currentSession.avg_speed_kmh,
          75
        );

        // Elevation tracking
        if (this.lastPoint.altitude && point.altitude) {
          const elevDiff = point.altitude - this.lastPoint.altitude;
          if (elevDiff > 0) {
            this.currentSession.elevation_gain_m = (this.currentSession.elevation_gain_m || 0) + elevDiff;
          } else {
            this.currentSession.elevation_loss_m = (this.currentSession.elevation_loss_m || 0) + Math.abs(elevDiff);
          }
        }

        // Check for split (every 5km for cycling)
        const lastSplitDistance = this.currentSession.splits.length > 0
          ? this.currentSession.splits[this.currentSession.splits.length - 1].distance_m
          : 0;
        
        if (this.currentSession.total_distance_m - lastSplitDistance >= 5000) {
          const splitDuration = timeDiff;
          const splitSpeed = (5000 / 1000) / (splitDuration / 3600);
          
          const split: RideSplit = {
            index: this.currentSession.splits.length + 1,
            distance_m: this.currentSession.total_distance_m,
            duration_s: splitDuration,
            avg_speed_kmh: splitSpeed,
            timestamp: point.timestamp,
          };
          
          this.currentSession.splits.push(split);

          if (this.currentSession.audio_cues_enabled) {
            Haptics.impact({ style: ImpactStyle.Medium });
          }
        }

        // Update HR metrics if available
        if (this.currentHR && this.currentSession.target_hr_zone) {
          this.updateHRMetrics();
        }
      }
    }

    this.lastPoint = point;
    this.notifyListeners();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async pauseTracking() {
    if (this.currentSession && this.status === 'riding') {
      this.status = 'paused';
      this.notifyListeners();
      rideStorageService.saveCurrentRide(this.currentSession);
    }
  }

  async resumeTracking() {
    if (this.currentSession && this.status === 'paused') {
      this.status = 'riding';
      this.notifyListeners();
    }
  }

  async stopTracking(): Promise<RideSession | null> {
    if (!this.currentSession) return null;

    // Stop GPS
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }

    // Stop auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    // Stop HR monitoring
    if (this.hrListener) {
      this.hrListener.remove();
      this.hrListener = null;
    }

    try {
      await TapfitHealth.stopWorkout();
    } catch (error) {
      console.error('Failed to stop workout:', error);
    }

    this.currentSession.ended_at = new Date().toISOString();
    this.currentSession.status = 'completed';

    const finalSession = { ...this.currentSession };

    // Sync to Supabase
    await this.syncToSupabase(finalSession);

    rideStorageService.clearCurrentRide();
    this.currentSession = null;
    this.status = 'completed';
    this.lastPoint = null;
    this.currentHR = null;

    this.notifyListeners();

    return finalSession;
  }

  private async syncToSupabase(session: RideSession) {
    try {
      const { error } = await supabase.from('ride_sessions').insert([{
        id: session.id,
        user_id: session.user_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        status: session.status,
        total_distance_m: session.total_distance_m,
        moving_time_s: Math.round(session.moving_time_s),
        elapsed_time_s: Math.round(session.elapsed_time_s),
        avg_speed_kmh: session.avg_speed_kmh,
        max_speed_kmh: session.max_speed_kmh,
        calories: session.calories,
        unit: session.unit,
        notes: session.notes,
        elevation_gain_m: session.elevation_gain_m,
        elevation_loss_m: session.elevation_loss_m,
        source: session.source,
        splits: session.splits as any,
        points: session.points as any,
        auto_pause_enabled: session.auto_pause_enabled,
        audio_cues_enabled: session.audio_cues_enabled,
        training_mode: session.training_mode,
        target_hr_zone: session.target_hr_zone as any,
        avg_heart_rate: session.avg_heart_rate,
        max_heart_rate: session.max_heart_rate,
        time_in_zone_s: Math.round(session.time_in_zone_s || 0),
        hr_samples: session.hr_samples as any,
        avg_cadence: session.avg_cadence,
        ride_type: session.ride_type,
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync ride to Supabase:', error);
    }
  }

  private async startHeartRateMonitoring() {
    try {
      await TapfitHealth.requestAuthorization();
      await TapfitHealth.startWorkout({ activityType: 'cycling' });

      this.hrListener = await TapfitHealth.addListener('heartRate', ({ bpm }) => {
        this.currentHR = Math.round(bpm);
        
        if (this.currentSession && this.currentHR) {
          this.currentSession.hr_samples = this.currentSession.hr_samples || [];
          this.currentSession.hr_samples.push({
            bpm: this.currentHR,
            timestamp: Date.now(),
          });

          if (!this.currentSession.max_heart_rate || this.currentHR > this.currentSession.max_heart_rate) {
            this.currentSession.max_heart_rate = this.currentHR;
          }

          this.updateHRMetrics();
        }
      });
    } catch (error) {
      console.error('Failed to start heart rate monitoring:', error);
    }
  }

  private updateHRMetrics() {
    if (!this.currentSession || !this.currentSession.hr_samples || !this.currentSession.target_hr_zone) return;

    const samples = this.currentSession.hr_samples;
    if (samples.length === 0) return;

    // Calculate average HR
    const totalBpm = samples.reduce((sum, s) => sum + s.bpm, 0);
    this.currentSession.avg_heart_rate = Math.round(totalBpm / samples.length);

    // Calculate time in zone
    const targetZone = this.currentSession.target_hr_zone;
    const samplesInZone = samples.filter(s => s.bpm >= targetZone.min_bpm && s.bpm <= targetZone.max_bpm);
    
    // Approximate time in zone (samples are collected every ~1 second)
    this.currentSession.time_in_zone_s = samplesInZone.length;

    this.notifyListeners();
  }

  getState(): { metrics: RideMetrics; status: RideTrackerStatus; session: RideSession | null } {
    const metrics: RideMetrics = {
      distance_m: this.currentSession?.total_distance_m || 0,
      elapsed_time_s: this.currentSession?.elapsed_time_s || 0,
      moving_time_s: this.currentSession?.moving_time_s || 0,
      current_speed_kmh: this.lastPoint?.speed ? metersPerSecondToSpeed(this.lastPoint.speed, 'km') : 0,
      avg_speed_kmh: this.currentSession?.avg_speed_kmh || 0,
      max_speed_kmh: this.currentSession?.max_speed_kmh || 0,
      calories: this.currentSession?.calories || 0,
      current_split: this.currentSession?.splits.length,
      elevation_gain_m: this.currentSession?.elevation_gain_m || 0,
      elevation_loss_m: this.currentSession?.elevation_loss_m || 0,
      gps_accuracy: this.lastPoint?.accuracy || 0,
      current_bpm: this.currentHR || undefined,
      avg_bpm: this.currentSession?.avg_heart_rate || undefined,
      time_in_zone_s: this.currentSession?.time_in_zone_s || 0,
      zone_status: this.getZoneStatus(),
    };

    return { metrics, status: this.status, session: this.currentSession };
  }

  private getZoneStatus(): 'below' | 'in_zone' | 'above' | undefined {
    if (!this.currentHR || !this.currentSession?.target_hr_zone) return undefined;

    const zone = this.currentSession.target_hr_zone;
    if (this.currentHR < zone.min_bpm) return 'below';
    if (this.currentHR > zone.max_bpm) return 'above';
    return 'in_zone';
  }

  subscribe(callback: StateCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    const { metrics, status } = this.getState();
    this.listeners.forEach(cb => cb(metrics, status));
  }
}

export const rideTrackerService = new RideTrackerService();
