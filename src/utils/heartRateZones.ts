export interface HRZone {
  name: string;
  min_bpm: number;
  max_bpm: number;
  intensity: string;
  description: string;
  color: string;
}

export function calculateHRZones(maxHR: number): HRZone[] {
  return [
    {
      name: 'Zone 1',
      min_bpm: Math.round(maxHR * 0.5),
      max_bpm: Math.round(maxHR * 0.6),
      intensity: 'Recovery',
      description: 'Warm-up and recovery',
      color: 'hsl(var(--chart-1))',
    },
    {
      name: 'Zone 2',
      min_bpm: Math.round(maxHR * 0.6),
      max_bpm: Math.round(maxHR * 0.7),
      intensity: 'Aerobic',
      description: 'Base endurance, fat burning',
      color: 'hsl(var(--chart-2))',
    },
    {
      name: 'Zone 3',
      min_bpm: Math.round(maxHR * 0.7),
      max_bpm: Math.round(maxHR * 0.8),
      intensity: 'Tempo',
      description: 'Aerobic fitness improvement',
      color: 'hsl(var(--chart-3))',
    },
    {
      name: 'Zone 4',
      min_bpm: Math.round(maxHR * 0.8),
      max_bpm: Math.round(maxHR * 0.9),
      intensity: 'Threshold',
      description: 'Lactate threshold, speed endurance',
      color: 'hsl(var(--chart-4))',
    },
    {
      name: 'Zone 5',
      min_bpm: Math.round(maxHR * 0.9),
      max_bpm: maxHR,
      intensity: 'VO2 Max',
      description: 'Peak performance, anaerobic',
      color: 'hsl(var(--chart-5))',
    },
  ];
}

export function estimateMaxHR(age: number): number {
  // Formula: 208 - (0.7 × age)
  return Math.round(208 - (0.7 * age));
}

export function getZoneStatus(
  currentBPM: number,
  targetZone: { min_bpm: number; max_bpm: number }
): 'below' | 'in_zone' | 'above' {
  if (currentBPM < targetZone.min_bpm) return 'below';
  if (currentBPM > targetZone.max_bpm) return 'above';
  return 'in_zone';
}

export function getCoachingCue(zoneStatus: 'below' | 'in_zone' | 'above'): string {
  switch (zoneStatus) {
    case 'below':
      return '🏃 Speed up to reach your target zone';
    case 'in_zone':
      return '✅ Perfect! Stay at this pace';
    case 'above':
      return '🚶 Slow down a bit';
  }
}

export function getZoneColor(zoneStatus: 'below' | 'in_zone' | 'above'): string {
  switch (zoneStatus) {
    case 'below':
      return 'hsl(var(--chart-2))';
    case 'in_zone':
      return 'hsl(142 76% 36%)';
    case 'above':
      return 'hsl(0 84% 60%)';
  }
}
