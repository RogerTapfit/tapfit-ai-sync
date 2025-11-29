import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';

export interface MuscleImbalance {
  id: string;
  muscleGroup: string;
  dominantSide: 'left' | 'right' | 'balanced';
  imbalancePercentage: number;
  trend: 'improving' | 'worsening' | 'stable';
  injuryRiskScore: number;
  avgLeftStrength: number;
  avgRightStrength: number;
  dataPointsCount: number;
  recommendedFocus?: string;
  lastUpdated: string;
}

export interface FormIssuePattern {
  type: string;
  count: number;
  lastOccurred: string;
  severity: 'low' | 'medium' | 'high';
  affectedExercises: string[];
}

export interface CorrectiveExercise {
  id: string;
  targetIssue: string;
  exerciseName: string;
  description: string;
  instructions: string;
  sets: number;
  reps: number;
  difficulty: string;
  muscleGroups: string[];
}

export interface InjuryRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  muscleImbalances: MuscleImbalance[];
  frequentFormIssues: FormIssuePattern[];
  correctiveRecommendations: CorrectiveExercise[];
  preWorkoutWarnings: string[];
}

export interface FormAnalysisLog {
  id: string;
  exerciseName: string;
  muscleGroup?: string;
  avgFormScore: number;
  leftSideScore?: number;
  rightSideScore?: number;
  imbalancePercentage?: number;
  imbalanceDirection?: string;
  formIssues: any[];
  injuryRiskLevel: string;
  flaggedPatterns: string[];
  createdAt: string;
}

export function useInjuryPrevention() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [riskAssessment, setRiskAssessment] = useState<InjuryRiskAssessment | null>(null);
  const [formHistory, setFormHistory] = useState<FormAnalysisLog[]>([]);
  const [muscleImbalances, setMuscleImbalances] = useState<MuscleImbalance[]>([]);
  const [correctiveExercises, setCorrectiveExercises] = useState<CorrectiveExercise[]>([]);

  // Fetch all injury prevention data
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch form analysis logs (last 30 days)
      const { data: formLogs, error: formError } = await supabase
        .from('form_analysis_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (formError) throw formError;

      // Fetch muscle imbalances
      const { data: imbalances, error: imbalanceError } = await supabase
        .from('muscle_imbalance_tracking')
        .select('*')
        .eq('user_id', user.id);

      if (imbalanceError) throw imbalanceError;

      // Fetch corrective exercises based on detected issues
      const targetIssues = new Set<string>();
      formLogs?.forEach(log => {
        (log.flagged_patterns as string[] || []).forEach(pattern => targetIssues.add(pattern));
      });
      imbalances?.forEach(imb => {
        if (imb.imbalance_percentage > 15) {
          targetIssues.add(`${imb.muscle_group}_imbalance`);
        }
      });

      const { data: exercises, error: exerciseError } = await supabase
        .from('corrective_exercises')
        .select('*')
        .eq('is_active', true);

      if (exerciseError) throw exerciseError;

      // Transform data
      const transformedLogs: FormAnalysisLog[] = (formLogs || []).map(log => ({
        id: log.id,
        exerciseName: log.exercise_name,
        muscleGroup: log.muscle_group,
        avgFormScore: log.avg_form_score || 100,
        leftSideScore: log.left_side_score,
        rightSideScore: log.right_side_score,
        imbalancePercentage: log.imbalance_percentage,
        imbalanceDirection: log.imbalance_direction,
        formIssues: Array.isArray(log.form_issues) ? log.form_issues : [],
        injuryRiskLevel: log.injury_risk_level || 'low',
        flaggedPatterns: log.flagged_patterns || [],
        createdAt: log.created_at,
      }));

      const transformedImbalances: MuscleImbalance[] = (imbalances || []).map(imb => ({
        id: imb.id,
        muscleGroup: imb.muscle_group,
        dominantSide: imb.dominant_side as 'left' | 'right' | 'balanced',
        imbalancePercentage: Number(imb.imbalance_percentage) || 0,
        trend: imb.trend as 'improving' | 'worsening' | 'stable',
        injuryRiskScore: imb.injury_risk_score || 0,
        avgLeftStrength: imb.avg_left_strength || 0,
        avgRightStrength: imb.avg_right_strength || 0,
        dataPointsCount: imb.data_points_count || 0,
        recommendedFocus: imb.recommended_focus,
        lastUpdated: imb.last_updated,
      }));

      const transformedExercises: CorrectiveExercise[] = (exercises || []).map(ex => ({
        id: ex.id,
        targetIssue: ex.target_issue,
        exerciseName: ex.exercise_name,
        description: ex.description || '',
        instructions: ex.instructions || '',
        sets: ex.sets || 3,
        reps: ex.reps || 12,
        difficulty: ex.difficulty || 'beginner',
        muscleGroups: ex.muscle_groups || [],
      }));

      // Calculate risk assessment
      const assessment = calculateRiskAssessment(transformedLogs, transformedImbalances, transformedExercises);

      setFormHistory(transformedLogs);
      setMuscleImbalances(transformedImbalances);
      setCorrectiveExercises(transformedExercises);
      setRiskAssessment(assessment);

    } catch (error) {
      console.error('Error fetching injury prevention data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Calculate comprehensive risk assessment
  const calculateRiskAssessment = (
    logs: FormAnalysisLog[],
    imbalances: MuscleImbalance[],
    exercises: CorrectiveExercise[]
  ): InjuryRiskAssessment => {
    // Calculate average form score
    const avgFormScore = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.avgFormScore, 0) / logs.length
      : 100;

    // Count significant imbalances
    const significantImbalances = imbalances.filter(i => i.imbalancePercentage > 15);

    // Count high-risk sessions
    const highRiskSessions = logs.filter(l => l.injuryRiskLevel === 'high').length;

    // Calculate overall risk score (0-100)
    const formScoreImpact = (100 - avgFormScore) * 0.4;
    const imbalanceImpact = significantImbalances.length * 15;
    const highRiskImpact = highRiskSessions * 10;
    const riskScore = Math.min(100, Math.max(0, formScoreImpact + imbalanceImpact + highRiskImpact));

    // Determine risk level
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 60) overallRisk = 'high';
    else if (riskScore >= 30) overallRisk = 'medium';

    // Analyze frequent form issues
    const issueMap = new Map<string, { count: number; lastOccurred: string; exercises: Set<string> }>();
    logs.forEach(log => {
      (log.formIssues as any[]).forEach((issue: any) => {
        const key = issue.type || issue.message;
        if (!issueMap.has(key)) {
          issueMap.set(key, { count: 0, lastOccurred: log.createdAt, exercises: new Set() });
        }
        const entry = issueMap.get(key)!;
        entry.count++;
        entry.exercises.add(log.exerciseName);
        if (new Date(log.createdAt) > new Date(entry.lastOccurred)) {
          entry.lastOccurred = log.createdAt;
        }
      });
    });

    const frequentFormIssues: FormIssuePattern[] = Array.from(issueMap.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([type, data]) => ({
        type,
        count: data.count,
        lastOccurred: data.lastOccurred,
        severity: (data.count >= 5 ? 'high' : data.count >= 3 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        affectedExercises: Array.from(data.exercises),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get relevant corrective exercises
    const relevantIssues = new Set<string>();
    significantImbalances.forEach(i => {
      if (i.muscleGroup.includes('shoulder')) relevantIssues.add('shoulder_imbalance');
      if (i.muscleGroup.includes('hip')) relevantIssues.add('hip_imbalance');
      if (i.muscleGroup.includes('leg') || i.muscleGroup.includes('knee')) relevantIssues.add('knee_valgus');
      if (i.muscleGroup.includes('core')) relevantIssues.add('core_weakness');
      if (i.muscleGroup.includes('back')) relevantIssues.add('lower_back_weakness');
    });
    frequentFormIssues.forEach(issue => {
      if (issue.type.includes('knee')) relevantIssues.add('knee_valgus');
      if (issue.type.includes('hip')) relevantIssues.add('hip_imbalance');
      if (issue.type.includes('shoulder')) relevantIssues.add('shoulder_imbalance');
    });

    const correctiveRecommendations = exercises
      .filter(ex => relevantIssues.has(ex.targetIssue))
      .slice(0, 6);

    // Generate pre-workout warnings
    const preWorkoutWarnings: string[] = [];
    significantImbalances.forEach(imb => {
      const weakSide = imb.dominantSide === 'left' ? 'right' : 'left';
      preWorkoutWarnings.push(
        `Your ${weakSide} ${imb.muscleGroup} is ${imb.imbalancePercentage.toFixed(0)}% weaker. Consider lighter weights for unilateral exercises.`
      );
    });
    if (highRiskSessions >= 3) {
      preWorkoutWarnings.push('Multiple high-risk form sessions detected. Focus on form over weight.');
    }
    if (avgFormScore < 70) {
      preWorkoutWarnings.push('Your average form score is below 70%. Consider reducing weight to improve technique.');
    }

    return {
      overallRisk,
      riskScore: Math.round(riskScore),
      muscleImbalances: significantImbalances,
      frequentFormIssues,
      correctiveRecommendations,
      preWorkoutWarnings: preWorkoutWarnings.slice(0, 3),
    };
  };

  // Log form analysis data
  const logFormAnalysis = useCallback(async (data: {
    exerciseName: string;
    muscleGroup?: string;
    avgFormScore: number;
    leftSideScore?: number;
    rightSideScore?: number;
    formIssues?: any[];
    exerciseLogId?: string;
  }) => {
    if (!user?.id) return;

    // Calculate imbalance
    let imbalancePercentage = 0;
    let imbalanceDirection = 'balanced';
    if (data.leftSideScore && data.rightSideScore) {
      imbalancePercentage = Math.abs(data.leftSideScore - data.rightSideScore) / 
        Math.max(data.leftSideScore, data.rightSideScore) * 100;
      if (data.leftSideScore > data.rightSideScore + 5) {
        imbalanceDirection = 'right_weak';
      } else if (data.rightSideScore > data.leftSideScore + 5) {
        imbalanceDirection = 'left_weak';
      }
    }

    // Determine injury risk level
    let injuryRiskLevel = 'low';
    if (data.avgFormScore < 50 || imbalancePercentage > 25) {
      injuryRiskLevel = 'high';
    } else if (data.avgFormScore < 70 || imbalancePercentage > 15) {
      injuryRiskLevel = 'medium';
    }

    // Detect flagged patterns from form issues
    const flaggedPatterns: string[] = [];
    (data.formIssues || []).forEach((issue: any) => {
      if (issue.type?.includes('knee')) flaggedPatterns.push('knee_valgus');
      if (issue.type?.includes('hip')) flaggedPatterns.push('hip_hike');
      if (issue.type?.includes('shoulder')) flaggedPatterns.push('shoulder_imbalance');
    });

    try {
      const { error } = await supabase.from('form_analysis_logs').insert({
        user_id: user.id,
        exercise_name: data.exerciseName,
        muscle_group: data.muscleGroup,
        avg_form_score: Math.round(data.avgFormScore),
        left_side_score: data.leftSideScore,
        right_side_score: data.rightSideScore,
        imbalance_percentage: imbalancePercentage,
        imbalance_direction: imbalanceDirection,
        form_issues: data.formIssues || [],
        injury_risk_level: injuryRiskLevel,
        flagged_patterns: flaggedPatterns,
        exercise_log_id: data.exerciseLogId,
      });

      if (error) throw error;

      // Update muscle imbalance tracking if we have side scores
      if (data.leftSideScore && data.rightSideScore && data.muscleGroup) {
        await supabase.rpc('update_muscle_imbalance', {
          _user_id: user.id,
          _muscle_group: data.muscleGroup,
          _left_score: data.leftSideScore,
          _right_score: data.rightSideScore,
        });
      }

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error logging form analysis:', error);
    }
  }, [user?.id, fetchData]);

  // Get injury context for AI coach
  const getInjuryContextForAI = useCallback((): string => {
    if (!riskAssessment) return '';

    let context = `\n\nINJURY PREVENTION CONTEXT:\n`;
    context += `- Overall Injury Risk: ${riskAssessment.overallRisk.toUpperCase()} (Score: ${riskAssessment.riskScore}/100)\n`;
    
    if (riskAssessment.muscleImbalances.length > 0) {
      context += `- Muscle Imbalances:\n`;
      riskAssessment.muscleImbalances.forEach(imb => {
        context += `  • ${imb.muscleGroup}: ${imb.imbalancePercentage.toFixed(0)}% (${imb.dominantSide} dominant, ${imb.trend})\n`;
      });
    }

    if (riskAssessment.frequentFormIssues.length > 0) {
      context += `- Frequent Form Issues:\n`;
      riskAssessment.frequentFormIssues.forEach(issue => {
        context += `  • ${issue.type}: ${issue.count} occurrences in ${issue.affectedExercises.join(', ')}\n`;
      });
    }

    if (riskAssessment.preWorkoutWarnings.length > 0) {
      context += `- Key Warnings:\n`;
      riskAssessment.preWorkoutWarnings.forEach(warning => {
        context += `  • ${warning}\n`;
      });
    }

    context += `\nGUIDELINES: If risk is HIGH, recommend recovery/lighter workouts. Address imbalances proactively. If user mentions pain, recommend rest and professional consultation.\n`;

    return context;
  }, [riskAssessment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    riskAssessment,
    formHistory,
    muscleImbalances,
    correctiveExercises,
    logFormAnalysis,
    getInjuryContextForAI,
    refetch: fetchData,
  };
}
