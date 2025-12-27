import { WebPlugin, PluginListenerHandle } from '@capacitor/core';
import type { TapfitHealthPlugin, StartWorkoutOptions } from './tapfitHealth';

export class TapfitHealthWeb extends WebPlugin implements TapfitHealthPlugin {
  private currentBpm: number | null = null;
  private isWorkoutActive = false;
  private heartRateInterval: NodeJS.Timeout | null = null;
  private heartRateListeners: Array<(data: { bpm: number; timestamp: number }) => void> = [];

  async isAvailable(): Promise<{ watchPaired: boolean }> {
    // Mock: Return false for web to indicate no watch is paired
    return { watchPaired: false };
  }

  async requestAuthorization(): Promise<{ authorized: boolean }> {
    // Mock: Always authorize for web development
    return { authorized: true };
  }

  async startWorkout(options?: StartWorkoutOptions): Promise<{ started: boolean }> {
    console.log('TapfitHealth Web: Starting mock workout', options);
    this.isWorkoutActive = true;
    this.startMockHeartRateData();
    return { started: true };
  }

  async stopWorkout(): Promise<{ stopped: boolean }> {
    console.log('TapfitHealth Web: Stopping mock workout');
    this.isWorkoutActive = false;
    this.stopMockHeartRateData();
    return { stopped: true };
  }

  async latestHeartRate(): Promise<{ bpm: number | null }> {
    return { bpm: this.currentBpm };
  }

  async addListener(
    eventName: 'heartRate',
    listenerFunc: (data: { bpm: number; timestamp: number }) => void
  ): Promise<PluginListenerHandle> {
    if (eventName === 'heartRate') {
      this.heartRateListeners.push(listenerFunc);
      
      return {
        remove: async () => {
          const index = this.heartRateListeners.indexOf(listenerFunc);
          if (index > -1) {
            this.heartRateListeners.splice(index, 1);
          }
        }
      };
    }
    
    return { remove: async () => {} };
  }

  private startMockHeartRateData() {
    if (this.heartRateInterval) {
      clearInterval(this.heartRateInterval);
    }

    // Generate realistic heart rate data (60-180 BPM)
    this.heartRateInterval = setInterval(() => {
      const baseBpm = 120;
      const variation = Math.sin(Date.now() / 5000) * 20; // Smooth variation
      const randomNoise = (Math.random() - 0.5) * 10; // Small random variations
      this.currentBpm = Math.round(baseBpm + variation + randomNoise);
      
      // Notify all listeners
      const data = {
        bpm: this.currentBpm,
        timestamp: Date.now()
      };
      
      this.heartRateListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in heart rate listener:', error);
        }
      });
    }, 2000); // Update every 2 seconds to prevent UI flashing
  }

  private stopMockHeartRateData() {
    if (this.heartRateInterval) {
      clearInterval(this.heartRateInterval);
      this.heartRateInterval = null;
    }
    this.currentBpm = null;
  }
}