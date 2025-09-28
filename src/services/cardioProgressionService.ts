import { 
  ProgressionMetrics, 
  SessionRecording, 
  CardioUserProfile,
  CardioGoal,
  HeartRateZone
} from '@/types/cardio';

export class CardioProgressionService {
  
  /**
   * Calculate progression metrics for a user
   */
  static calculateProgressionMetrics(
    recentSessions: SessionRecording[],
    userProfile: CardioUserProfile
  ): ProgressionMetrics {
    
    if (recentSessions.length === 0) {
      return {
        weekly_trimp_load: 0,
        seven_day_avg_trimp: 0,
        fatigue_ratio: 0,
        last_session_rpe: 5,
        progression_readiness: 'ready'
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Filter sessions by timeframe
    const weekSessions = recentSessions.filter(s => 
      new Date(s.session_id) >= sevenDaysAgo
    );
    
    const yesterdaySession = recentSessions.find(s =>
      new Date(s.session_id).toDateString() === yesterday.toDateString()
    );
    
    // Calculate metrics
    const weeklyTRIMP = weekSessions.reduce((sum, s) => sum + s.trimp_score, 0);
    const sevenDayAvg = weeklyTRIMP / 7;
    const yesterdayTRIMP = yesterdaySession?.trimp_score || 0;
    const fatigueRatio = sevenDayAvg > 0 ? yesterdayTRIMP / sevenDayAvg : 0;
    const lastRPE = recentSessions[0]?.rpe || 5;
    
    // Determine progression readiness
    let readiness: 'ready' | 'maintain' | 'deload' = 'ready';
    
    if (fatigueRatio > 1.4) {
      readiness = 'deload'; // Too much fatigue
    } else if (lastRPE >= 8 || fatigueRatio > 1.2) {
      readiness = 'maintain'; // Moderate fatigue
    }
    
    return {
      weekly_trimp_load: weeklyTRIMP,
      seven_day_avg_trimp: sevenDayAvg,
      fatigue_ratio: fatigueRatio,
      last_session_rpe: lastRPE,
      progression_readiness: readiness
    };
  }

  /**
   * Get recommended next session based on progression state
   */
  static getNextSessionRecommendation(
    progressionMetrics: ProgressionMetrics,
    lastSessionGoal: CardioGoal,
    userProfile: CardioUserProfile
  ): {
    goal: CardioGoal;
    targetZone: HeartRateZone;
    targetLoad: number;
    duration: number;
    reasoning: string;
  } {
    
    const { progression_readiness, fatigue_ratio, last_session_rpe } = progressionMetrics;
    
    // Recovery session needed
    if (progression_readiness === 'deload' || fatigue_ratio > 1.4) {
      return {
        goal: 'recovery',
        targetZone: 'Z1',
        targetLoad: 20,
        duration: 30,
        reasoning: 'High fatigue detected. Recovery session recommended to prevent overtraining.'
      };
    }
    
    // Maintain current load
    if (progression_readiness === 'maintain' || last_session_rpe >= 8) {
      return {
        goal: lastSessionGoal,
        targetZone: 'Z2',
        targetLoad: Math.max(30, progressionMetrics.seven_day_avg_trimp),
        duration: 35,
        reasoning: 'Moderate fatigue. Maintaining current training load.'
      };
    }
    
    // Ready for progression
    const baseLoad = Math.max(40, progressionMetrics.seven_day_avg_trimp * 1.1); // 10% increase
    
    // Rotate goals for variety and periodization
    const goalProgression = this.getProgressiveGoal(lastSessionGoal, userProfile);
    
    return {
      goal: goalProgression.goal,
      targetZone: goalProgression.zone,
      targetLoad: baseLoad,
      duration: goalProgression.duration,
      reasoning: goalProgression.reasoning
    };
  }

  /**
   * Get progressive goal based on training history
   */
  private static getProgressiveGoal(
    lastGoal: CardioGoal,
    userProfile: CardioUserProfile
  ): {
    goal: CardioGoal;
    zone: HeartRateZone;
    duration: number;
    reasoning: string;
  } {
    
    // Simple progression cycle: Recovery → Endurance → Intervals → Endurance → Recovery
    switch (lastGoal) {
      case 'recovery':
        return {
          goal: 'endurance',
          zone: 'Z2',
          duration: 40,
          reasoning: 'Progressing from recovery to base endurance building.'
        };
        
      case 'endurance':
        return {
          goal: 'intervals',
          zone: 'Z3-Z4',
          duration: 35,
          reasoning: 'Adding high-intensity intervals to improve VO2max and power.'
        };
        
      case 'intervals':
        return {
          goal: 'endurance',
          zone: 'Z2-Z3',
          duration: 45,
          reasoning: 'Building aerobic base after intensity session.'
        };
        
      case 'calories':
        return {
          goal: 'endurance',
          zone: 'Z2',
          duration: 40,
          reasoning: 'Maintaining steady aerobic fitness development.'
        };
        
      default:
        return {
          goal: 'endurance',
          zone: 'Z2',
          duration: 35,
          reasoning: 'Default progression: building aerobic base.'
        };
    }
  }

  /**
   * Calculate weekly training plan with periodization
   */
  static generateWeeklyPlan(
    progressionMetrics: ProgressionMetrics,
    userProfile: CardioUserProfile,
    targetSessionsPerWeek: number = 4
  ): Array<{
    day: string;
    goal: CardioGoal;
    targetZone: HeartRateZone;
    duration: number;
    priority: 'high' | 'medium' | 'low';
  }> {
    
    const plan = [];
    const { progression_readiness } = progressionMetrics;
    
    // Week structure: 2x endurance, 1x intervals, 1x recovery (for 4 sessions)
    const weekTemplate = [
      { goal: 'endurance' as CardioGoal, priority: 'high' as const },
      { goal: 'intervals' as CardioGoal, priority: 'high' as const },
      { goal: 'endurance' as CardioGoal, priority: 'medium' as const },
      { goal: 'recovery' as CardioGoal, priority: 'low' as const }
    ];
    
    // Adjust for fatigue state
    if (progression_readiness === 'deload') {
      // More recovery sessions during deload
      weekTemplate[0] = { goal: 'recovery', priority: 'high' };
      weekTemplate[1] = { goal: 'endurance', priority: 'medium' };
      weekTemplate[2] = { goal: 'recovery', priority: 'medium' };
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const trainingDays = days.slice(0, targetSessionsPerWeek);
    
    trainingDays.forEach((day, index) => {
      const template = weekTemplate[index] || { goal: 'recovery', priority: 'low' };
      const duration = this.getDurationForGoal(template.goal, progression_readiness);
      const zone = this.getZoneForGoal(template.goal);
      
      plan.push({
        day,
        goal: template.goal,
        targetZone: zone,
        duration,
        priority: template.priority
      });
    });
    
    return plan;
  }

  private static getDurationForGoal(
    goal: CardioGoal, 
    readiness: 'ready' | 'maintain' | 'deload'
  ): number {
    const baseDurations = {
      endurance: 40,
      intervals: 35,
      recovery: 25,
      calories: 45
    };
    
    const multiplier = readiness === 'deload' ? 0.8 : readiness === 'maintain' ? 0.9 : 1.0;
    return Math.round(baseDurations[goal] * multiplier);
  }

  private static getZoneForGoal(goal: CardioGoal): HeartRateZone {
    const zoneMap = {
      endurance: 'Z2' as HeartRateZone,
      intervals: 'Z3-Z4' as HeartRateZone,
      recovery: 'Z1' as HeartRateZone,
      calories: 'Z2-Z3' as HeartRateZone
    };
    
    return zoneMap[goal];
  }

  /**
   * Track performance improvements over time
   */
  static analyzePerformanceTrends(
    sessions: SessionRecording[],
    timeframeDays: number = 30
  ): {
    avgHRTrend: 'improving' | 'stable' | 'declining';
    powerTrend: 'improving' | 'stable' | 'declining';
    enduranceTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  } {
    
    if (sessions.length < 3) {
      return {
        avgHRTrend: 'stable',
        powerTrend: 'stable',
        enduranceTrend: 'stable',
        recommendations: ['Need more sessions for trend analysis']
      };
    }
    
    const recentSessions = sessions.slice(0, Math.floor(sessions.length / 2));
    const olderSessions = sessions.slice(Math.floor(sessions.length / 2));
    
    // Analyze average heart rate at same intensity (efficiency)
    const recentAvgHR = recentSessions.reduce((sum, s) => sum + s.hr_avg, 0) / recentSessions.length;
    const olderAvgHR = olderSessions.reduce((sum, s) => sum + s.hr_avg, 0) / olderSessions.length;
    const hrTrend = recentAvgHR < olderAvgHR - 3 ? 'improving' : 
                   recentAvgHR > olderAvgHR + 3 ? 'declining' : 'stable';
    
    // Analyze power/performance metrics
    const recentAvgWatts = recentSessions
      .filter(s => s.watts_avg)
      .reduce((sum, s) => sum + (s.watts_avg || 0), 0) / recentSessions.length;
    const olderAvgWatts = olderSessions
      .filter(s => s.watts_avg)
      .reduce((sum, s) => sum + (s.watts_avg || 0), 0) / olderSessions.length;
    const powerTrend = recentAvgWatts > olderAvgWatts * 1.05 ? 'improving' :
                      recentAvgWatts < olderAvgWatts * 0.95 ? 'declining' : 'stable';
    
    // Analyze endurance (duration at target intensity)
    const recentAvgDuration = recentSessions.reduce((sum, s) => sum + s.duration_min, 0) / recentSessions.length;
    const olderAvgDuration = olderSessions.reduce((sum, s) => sum + s.duration_min, 0) / olderSessions.length;
    const enduranceTrend = recentAvgDuration > olderAvgDuration * 1.1 ? 'improving' :
                          recentAvgDuration < olderAvgDuration * 0.9 ? 'declining' : 'stable';
    
    // Generate recommendations
    const recommendations = [];
    if (hrTrend === 'declining') recommendations.push('Consider more recovery sessions');
    if (powerTrend === 'declining') recommendations.push('Add strength training or higher intensity intervals');
    if (enduranceTrend === 'declining') recommendations.push('Focus on longer, steady-state sessions');
    if (hrTrend === 'improving' && powerTrend === 'improving') {
      recommendations.push('Great progress! Consider progressing to more challenging sessions');
    }
    
    return {
      avgHRTrend: hrTrend,
      powerTrend,
      enduranceTrend,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue current training approach']
    };
  }
}