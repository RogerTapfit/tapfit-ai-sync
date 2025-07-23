import { Capacitor } from '@capacitor/core';

// Health data types we're interested in
export interface HealthMetrics {
  heartRate?: number;
  bloodOxygen?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  vo2Max?: number;
  activeEnergyBurned?: number;
  steps?: number;
}

export interface HealthAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  message: string;
  threshold: number;
}

// Health thresholds for alerts
const HEALTH_THRESHOLDS = {
  bloodOxygen: {
    critical: 90,
    warning: 95
  },
  heartRate: {
    maxSafe: 185, // Age-dependent, this is for ~35 years old
    restingHigh: 100
  },
  bloodPressure: {
    systolicHigh: 140,
    diastolicHigh: 90,
    systolicCritical: 180,
    diastolicCritical: 120
  }
};

class HealthKitService {
  private isAvailable = false;
  private hasPermissions = false;
  private listeners: ((metrics: HealthMetrics) => void)[] = [];
  private alertListeners: ((alert: HealthAlert) => void)[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Check if we're on iOS and HealthKit is available
    this.isAvailable = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    
    if (!this.isAvailable) {
      console.log('HealthKit not available on this platform');
      return;
    }

    console.log('HealthKit service initialized');
  }

  // Request HealthKit permissions
  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      // Simulate permission request for now
      // In a real implementation, this would use HealthKit APIs
      console.log('Requesting HealthKit permissions...');
      
      // Simulate permission grant
      this.hasPermissions = true;
      
      return true;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      return false;
    }
  }

  // Start real-time health monitoring
  async startMonitoring(): Promise<boolean> {
    if (!this.isAvailable || !this.hasPermissions) {
      console.log('HealthKit monitoring not available');
      return false;
    }

    if (this.updateInterval) {
      this.stopMonitoring();
    }

    console.log('Starting HealthKit monitoring...');

    // Start polling for health data every 5 seconds
    this.updateInterval = setInterval(() => {
      this.fetchLatestHealthData();
    }, 5000);

    // Initial fetch
    this.fetchLatestHealthData();

    return true;
  }

  // Stop real-time health monitoring
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('HealthKit monitoring stopped');
  }

  // Fetch latest health data
  private async fetchLatestHealthData() {
    try {
      // Simulate fetching real health data
      // In a real implementation, this would query HealthKit
      const simulatedMetrics: HealthMetrics = {
        heartRate: this.generateRealisticHeartRate(),
        bloodOxygen: this.generateRealisticBloodOxygen(),
        bloodPressureSystolic: this.generateRealisticBloodPressure().systolic,
        bloodPressureDiastolic: this.generateRealisticBloodPressure().diastolic,
        vo2Max: this.generateRealisticVO2Max(),
        activeEnergyBurned: this.generateRealisticEnergyBurned(),
        steps: this.generateRealisticSteps()
      };

      // Check for health alerts
      this.checkHealthAlerts(simulatedMetrics);

      // Notify all listeners
      this.listeners.forEach(listener => listener(simulatedMetrics));

    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  }

  // Generate realistic heart rate during workout
  private generateRealisticHeartRate(): number {
    // Simulate workout heart rate between 130-170 BPM
    const baseRate = 140;
    const variation = Math.random() * 30 - 15; // ±15 BPM variation
    return Math.round(baseRate + variation);
  }

  // Generate realistic blood oxygen level
  private generateRealisticBloodOxygen(): number {
    // Normal SpO2 is 95-100%, during exercise might be slightly lower
    const baseLevel = 97;
    const variation = Math.random() * 4 - 2; // ±2% variation
    return Math.round(Math.min(100, Math.max(88, baseLevel + variation)));
  }

  // Generate realistic blood pressure
  private generateRealisticBloodPressure(): { systolic: number; diastolic: number } {
    // Normal BP during exercise might be elevated
    const baseSystolic = 130;
    const baseDiastolic = 80;
    const systolicVariation = Math.random() * 20 - 10;
    const diastolicVariation = Math.random() * 10 - 5;
    
    return {
      systolic: Math.round(baseSystolic + systolicVariation),
      diastolic: Math.round(baseDiastolic + diastolicVariation)
    };
  }

  // Generate realistic VO2 Max
  private generateRealisticVO2Max(): number {
    // Average VO2 Max for adults
    return Math.round(35 + Math.random() * 20);
  }

  // Generate realistic active energy burned
  private generateRealisticEnergyBurned(): number {
    // Calories burned during active session
    return Math.round(200 + Math.random() * 300);
  }

  // Generate realistic step count
  private generateRealisticSteps(): number {
    return Math.round(5000 + Math.random() * 3000);
  }

  // Check for health alerts
  private checkHealthAlerts(metrics: HealthMetrics) {
    const alerts: HealthAlert[] = [];

    // Check blood oxygen
    if (metrics.bloodOxygen !== undefined) {
      if (metrics.bloodOxygen < HEALTH_THRESHOLDS.bloodOxygen.critical) {
        alerts.push({
          type: 'critical',
          metric: 'Blood Oxygen',
          value: metrics.bloodOxygen,
          message: 'Blood oxygen critically low - consider stopping exercise',
          threshold: HEALTH_THRESHOLDS.bloodOxygen.critical
        });
      } else if (metrics.bloodOxygen < HEALTH_THRESHOLDS.bloodOxygen.warning) {
        alerts.push({
          type: 'warning',
          metric: 'Blood Oxygen',
          value: metrics.bloodOxygen,
          message: 'Blood oxygen low - monitor closely',
          threshold: HEALTH_THRESHOLDS.bloodOxygen.warning
        });
      }
    }

    // Check blood pressure
    if (metrics.bloodPressureSystolic !== undefined && metrics.bloodPressureDiastolic !== undefined) {
      if (metrics.bloodPressureSystolic > HEALTH_THRESHOLDS.bloodPressure.systolicCritical ||
          metrics.bloodPressureDiastolic > HEALTH_THRESHOLDS.bloodPressure.diastolicCritical) {
        alerts.push({
          type: 'critical',
          metric: 'Blood Pressure',
          value: metrics.bloodPressureSystolic,
          message: 'Blood pressure critically high - stop exercise immediately',
          threshold: HEALTH_THRESHOLDS.bloodPressure.systolicCritical
        });
      } else if (metrics.bloodPressureSystolic > HEALTH_THRESHOLDS.bloodPressure.systolicHigh ||
                 metrics.bloodPressureDiastolic > HEALTH_THRESHOLDS.bloodPressure.diastolicHigh) {
        alerts.push({
          type: 'warning',
          metric: 'Blood Pressure',
          value: metrics.bloodPressureSystolic,
          message: 'Blood pressure elevated - consider reducing intensity',
          threshold: HEALTH_THRESHOLDS.bloodPressure.systolicHigh
        });
      }
    }

    // Check heart rate
    if (metrics.heartRate !== undefined) {
      if (metrics.heartRate > HEALTH_THRESHOLDS.heartRate.maxSafe) {
        alerts.push({
          type: 'critical',
          metric: 'Heart Rate',
          value: metrics.heartRate,
          message: 'Heart rate too high - reduce intensity immediately',
          threshold: HEALTH_THRESHOLDS.heartRate.maxSafe
        });
      }
    }

    // Notify alert listeners
    alerts.forEach(alert => {
      this.alertListeners.forEach(listener => listener(alert));
    });
  }

  // Subscribe to health data updates
  onHealthDataUpdate(callback: (metrics: HealthMetrics) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Subscribe to health alerts
  onHealthAlert(callback: (alert: HealthAlert) => void) {
    this.alertListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.alertListeners = this.alertListeners.filter(listener => listener !== callback);
    };
  }

  // Get current availability status
  getAvailabilityStatus() {
    return {
      isAvailable: this.isAvailable,
      hasPermissions: this.hasPermissions,
      platform: Capacitor.getPlatform()
    };
  }

  // Export health data for user
  async exportHealthData(startDate: Date, endDate: Date): Promise<HealthMetrics[]> {
    if (!this.isAvailable || !this.hasPermissions) {
      throw new Error('HealthKit not available or permissions not granted');
    }

    // Simulate exporting health data
    // In a real implementation, this would query HealthKit for historical data
    console.log(`Exporting health data from ${startDate} to ${endDate}`);
    
    return [];
  }
}

// Export singleton instance
export const healthKitService = new HealthKitService();