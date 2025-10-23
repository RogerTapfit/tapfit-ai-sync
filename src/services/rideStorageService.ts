import { RideSession } from '@/types/ride';

const STORAGE_KEY = 'tapfit_current_ride';

export const rideStorageService = {
  saveCurrentRide(session: RideSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save ride to storage:', error);
    }
  },

  getCurrentRide(): RideSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load ride from storage:', error);
      return null;
    }
  },

  clearCurrentRide(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear ride storage:', error);
    }
  },
};
