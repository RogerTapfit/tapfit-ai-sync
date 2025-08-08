import { registerPlugin } from '@capacitor/core';

export interface StartWorkoutOptions { activityType?: string }
export interface TapfitHealthPlugin {
  isAvailable(): Promise<{ watchPaired: boolean }>
  requestAuthorization(): Promise<{ authorized: boolean }>
  startWorkout(options?: StartWorkoutOptions): Promise<{ started: boolean }>
  stopWorkout(): Promise<{ stopped: boolean }>
  latestHeartRate(): Promise<{ bpm: number | null }>
  addListener(eventName: 'heartRate', listenerFunc: (data: { bpm: number; timestamp: number }) => void): Promise<{ remove: () => void }>
}

export const TapfitHealth = registerPlugin<TapfitHealthPlugin>('TapfitHealth');
