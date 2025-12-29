import { RunPoint } from '@/types/run';

/**
 * Estimate steps from distance based on activity type
 * Running: ~1,400 steps per km (longer stride)
 * Walking: ~1,300 steps per km (shorter stride)
 */
export function estimateSteps(distanceMeters: number, activityType: 'run' | 'walk' = 'run'): number {
  const stepsPerKm = activityType === 'walk' ? 1300 : 1400;
  const distanceKm = distanceMeters / 1000;
  return Math.round(distanceKm * stepsPerKm);
}

/**
 * Format distance in meters to user-friendly string
 */
export function formatDistance(meters: number, unit: 'km' | 'mi'): string {
  if (unit === 'mi') {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Format time in seconds to HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format pace in sec/km to MM:SS/unit string
 */
export function formatPace(secPerKm: number, unit: 'km' | 'mi'): string {
  if (!secPerKm || secPerKm <= 0 || !isFinite(secPerKm)) {
    return unit === 'mi' ? '--:--/mi' : '--:--/km';
  }
  
  const secPerUnit = unit === 'mi' ? secPerKm * 1.60934 : secPerKm;
  const minutes = Math.floor(secPerUnit / 60);
  const seconds = Math.floor(secPerUnit % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}/${unit}`;
}

/**
 * Calculate distance between two GPS points using Haversine formula
 */
export function calculateDistance(p1: RunPoint, p2: RunPoint): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lon - p1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

/**
 * Calculate calories burned (basic MET estimation)
 * MET for running: ~1 MET per 1 km/h
 */
export function calculateCalories(
  distanceMeters: number,
  timeSeconds: number,
  weightKg: number = 70 // Default weight
): number {
  if (timeSeconds <= 0) return 0;
  
  const distanceKm = distanceMeters / 1000;
  const timeHours = timeSeconds / 3600;
  const speedKmh = distanceKm / timeHours;
  
  // Rough MET calculation: running MET ≈ speed in km/h
  const met = Math.max(speedKmh, 3); // Minimum 3 MET
  const calories = met * weightKg * timeHours;
  
  return Math.round(calories);
}

/**
 * Smooth elevation data using moving average
 */
export function smoothElevation(points: RunPoint[], windowSize: number = 5): number[] {
  if (points.length < windowSize) return points.map(p => p.altitude || 0);
  
  const smoothed: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(points.length, i + Math.ceil(windowSize / 2));
    const window = points.slice(start, end);
    const avg = window.reduce((sum, p) => sum + (p.altitude || 0), 0) / window.length;
    smoothed.push(avg);
  }
  
  return smoothed;
}

/**
 * Calculate elevation gain and loss
 */
export function calculateElevationChange(
  smoothedElevations: number[],
  threshold: number = 1 // meters
): { gain: number; loss: number } {
  let gain = 0;
  let loss = 0;
  
  for (let i = 1; i < smoothedElevations.length; i++) {
    const diff = smoothedElevations[i] - smoothedElevations[i - 1];
    if (Math.abs(diff) > threshold) {
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }
  }
  
  return { gain: Math.round(gain), loss: Math.round(loss) };
}
