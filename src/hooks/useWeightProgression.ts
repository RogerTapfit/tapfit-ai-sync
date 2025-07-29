import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateProgressedWeight, shouldProgressWeight } from '@/services/weightCalculationService';

export interface WorkoutPerformance {
  id?: string;
  user_id: string;
  workout_exercise_id: string;
  scheduled_workout_id: string;
  completed_sets: number;
  completed_reps: number;
  actual_weight?: number;
  recommended_weight?: number;
  perceived_exertion?: number; // 1-5 scale
  completion_percentage: number;
  notes?: string;
}

export interface WeightProgression {
  id?: string;
  user_id: string;
  exercise_name: string;
  machine_name?: string;
  previous_weight?: number;
  new_weight: number;
  progression_reason: 'automatic_increase' | 'manual_adjustment' | 'plateau_detected' | 'performance_decrease';
  week_number?: number;
}

export const useWeightProgression = () => {
  const [loading, setLoading] = useState(false);
  const [progressions, setProgressions] = useState<WeightProgression[]>([]);

  // Record workout performance
  const recordPerformance = async (performance: WorkoutPerformance) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const performanceData = {
        ...performance,
        user_id: user.id
      };

      const { error } = await supabase
        .from('workout_performance')
        .insert(performanceData);

      if (error) throw error;

      // Check if weight should be progressed
      await checkForProgression(performance);
      
    } catch (error) {
      console.error('Error recording performance:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if weight should be progressed based on recent performance
  const checkForProgression = async (performance: WorkoutPerformance) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent performances for this exercise to determine progression
      const { data: recentPerformances } = await supabase
        .from('workout_performance')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_exercise_id', performance.workout_exercise_id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (!recentPerformances || recentPerformances.length < 2) return;

      // Calculate average performance metrics
      const avgCompletion = recentPerformances.reduce((sum, p) => sum + p.completion_percentage, 0) / recentPerformances.length;
      const avgExertion = recentPerformances.reduce((sum, p) => sum + (p.perceived_exertion || 3), 0) / recentPerformances.length;
      
      // Count weeks at current weight
      const currentWeight = performance.actual_weight || performance.recommended_weight || 0;
      const weeksAtWeight = recentPerformances.filter(p => 
        (p.actual_weight || p.recommended_weight) === currentWeight
      ).length;

      // Determine if progression is needed
      const progressionDecision = shouldProgressWeight(avgCompletion, avgExertion, weeksAtWeight);

      if (progressionDecision.shouldProgress && performance.actual_weight) {
        const newWeight = calculateProgressedWeight(performance.actual_weight, progressionDecision.percentage);
        
        await recordWeightProgression({
          user_id: user.id,
          exercise_name: 'Unknown Exercise', // Would need to get this from exercise data
          machine_name: 'Unknown Machine', // Would need to get this from exercise data
          previous_weight: performance.actual_weight,
          new_weight: newWeight,
          progression_reason: progressionDecision.progressionType === 'increase' ? 'automatic_increase' : 'performance_decrease'
        });
      }
    } catch (error) {
      console.error('Error checking progression:', error);
    }
  };

  // Record weight progression
  const recordWeightProgression = async (progression: Omit<WeightProgression, 'id'>) => {
    try {
      const { error } = await supabase
        .from('weight_progressions')
        .insert(progression);

      if (error) throw error;

      // Refresh progressions
      await loadProgressions();
    } catch (error) {
      console.error('Error recording progression:', error);
      throw error;
    }
  };

  // Load user's weight progressions
  const loadProgressions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weight_progressions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProgressions((data || []) as WeightProgression[]);
    } catch (error) {
      console.error('Error loading progressions:', error);
    }
  };

  // Get current weight for an exercise
  const getCurrentWeight = async (exerciseName: string, machineName: string): Promise<number | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('weight_progressions')
        .select('new_weight')
        .eq('user_id', user.id)
        .eq('exercise_name', exerciseName)
        .eq('machine_name', machineName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data?.new_weight || null;
    } catch (error) {
      console.error('Error getting current weight:', error);
      return null;
    }
  };

  // Get performance history for an exercise
  const getPerformanceHistory = async (exerciseName: string, limit: number = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('workout_performance')
        .select(`
          *,
          workout_exercises!inner(machine_name)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting performance history:', error);
      return [];
    }
  };

  useEffect(() => {
    loadProgressions();
  }, []);

  return {
    loading,
    progressions,
    recordPerformance,
    recordWeightProgression,
    getCurrentWeight,
    getPerformanceHistory,
    loadProgressions
  };
};