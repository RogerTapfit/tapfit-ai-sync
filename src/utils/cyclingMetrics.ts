// Convert m/s to km/h or mph
export function metersPerSecondToSpeed(mps: number, unit: 'km' | 'mi'): number {
  const kmh = mps * 3.6;
  return unit === 'mi' ? kmh * 0.621371 : kmh;
}

// Estimate cycling power (watts) from speed and gradient
export function estimatePower(speedKmh: number, gradientPercent: number, riderWeightKg: number = 75): number {
  const speedMs = speedKmh / 3.6;
  const rollingResistance = 0.004; // Typical for road bikes
  const windResistance = 0.5 * 1.2 * 0.4 * Math.pow(speedMs, 3);
  const gravityForce = riderWeightKg * 9.81 * (gradientPercent / 100) * speedMs;
  const rollingForce = riderWeightKg * 9.81 * rollingResistance * speedMs;
  
  return Math.round(windResistance + gravityForce + rollingForce);
}

// Calculate cycling calories (more accurate than running formula)
export function calculateCyclingCalories(
  durationMinutes: number,
  avgSpeedKmh: number,
  weightKg: number = 75
): number {
  let met = 4.0; // Very light cycling
  
  if (avgSpeedKmh < 16) met = 4.0;
  else if (avgSpeedKmh < 19) met = 6.0;
  else if (avgSpeedKmh < 22) met = 8.0;
  else if (avgSpeedKmh < 25) met = 10.0;
  else if (avgSpeedKmh < 30) met = 12.0;
  else met = 15.0;
  
  return Math.round(met * weightKg * (durationMinutes / 60));
}

// Estimate cadence from speed (rough approximation)
export function estimateCadence(speedKmh: number): number {
  if (speedKmh < 15) return 60;
  if (speedKmh < 20) return 70;
  if (speedKmh < 25) return 80;
  if (speedKmh < 30) return 90;
  return 100;
}

// Format speed for display
export function formatSpeed(speedKmh: number, unit: 'km' | 'mi'): string {
  const speed = unit === 'mi' ? speedKmh * 0.621371 : speedKmh;
  return speed.toFixed(1);
}

// Format distance for display
export function formatDistance(distanceM: number, unit: 'km' | 'mi'): string {
  const km = distanceM / 1000;
  const distance = unit === 'mi' ? km * 0.621371 : km;
  return distance.toFixed(2);
}
