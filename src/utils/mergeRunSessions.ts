import { RunSession } from '@/types/run';

export interface MergedRunSession extends RunSession {
  sessionCount: number;
  mergedSessionIds: string[];
}

export function mergeConsecutiveSessions(
  sessions: RunSession[],
  maxGapMinutes: number = 10
): MergedRunSession[] {
  if (!sessions || sessions.length === 0) return [];
  
  // Sort by started_at (oldest first)
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  
  const merged: MergedRunSession[] = [];
  let currentGroup: RunSession[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    // Get end time of previous session
    const prevEnd = prev.ended_at 
      ? new Date(prev.ended_at).getTime()
      : new Date(prev.started_at).getTime() + (prev.moving_time_s || 0) * 1000;
    
    const currStart = new Date(curr.started_at).getTime();
    const gapMinutes = (currStart - prevEnd) / (1000 * 60);
    
    // Check if same activity type and gap is within threshold
    const sameActivity = prev.activity_type === curr.activity_type;
    const withinGap = gapMinutes >= 0 && gapMinutes < maxGapMinutes;
    
    if (sameActivity && withinGap) {
      currentGroup.push(curr);
    } else {
      merged.push(mergeGroup(currentGroup));
      currentGroup = [curr];
    }
  }
  
  // Don't forget the last group
  merged.push(mergeGroup(currentGroup));
  
  // Sort by started_at descending for display (most recent first)
  return merged.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

function mergeGroup(sessions: RunSession[]): MergedRunSession {
  if (sessions.length === 1) {
    return {
      ...sessions[0],
      sessionCount: 1,
      mergedSessionIds: [sessions[0].id],
    };
  }
  
  // Aggregate all values
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  
  const totalDistance = sessions.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
  const totalTime = sessions.reduce((sum, s) => sum + (s.moving_time_s || 0), 0);
  const totalCalories = sessions.reduce((sum, s) => sum + (s.calories || 0), 0);
  
  // Concatenate all points
  const allPoints = sessions.flatMap(s => s.points || []);
  
  // Concatenate all splits
  const allSplits = sessions.flatMap(s => s.splits || []);
  
  // Concatenate HR samples
  const allHrSamples = sessions.flatMap(s => s.hr_samples || []);
  
  // Calculate average pace from totals
  const avgPace = totalDistance > 0 
    ? (totalTime / (totalDistance / 1000)) 
    : 0;
  
  // Status: active if any is active
  const hasActive = sessions.some(s => s.status === 'active');
  const hasPaused = sessions.some(s => s.status === 'paused');
  const status = hasActive ? 'active' : hasPaused ? 'paused' : 'completed';
  
  return {
    ...first,
    ended_at: last.ended_at,
    total_distance_m: totalDistance,
    moving_time_s: totalTime,
    calories: totalCalories,
    avg_pace_sec_per_km: avgPace,
    points: allPoints,
    splits: allSplits,
    hr_samples: allHrSamples,
    status,
    sessionCount: sessions.length,
    mergedSessionIds: sessions.map(s => s.id),
  };
}
