import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateOptimalWeight, 
  calculateSetsAndReps,
  UserWeightProfile,
  ExerciseWeightCalculation
} from '@/services/weightCalculationService';
import { usePowerLevel } from './usePowerLevel';
import { snapToAvailableWeight } from './useWeightStack';

interface UseWeightRecommendationProps {
  exerciseName: string;
  machineName: string;
  muscleGroup: string;
  historicalWeight?: number; // Priority override from last workout
  historicalReps?: number; // Reps from last workout
  machineMaxWeight?: number; // Machine's max weight from crowd-sourced specs
}

export const useWeightRecommendation = ({ 
  exerciseName, 
  machineName, 
  muscleGroup,
  historicalWeight,
  historicalReps,
  machineMaxWeight
}: UseWeightRecommendationProps) => {
  const [recommendation, setRecommendation] = useState<ExerciseWeightCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightStack, setWeightStack] = useState<number[] | null>(null);
  const { powerLevel } = usePowerLevel();

  useEffect(() => {
    fetchUserProfileAndCalculate();
  }, [exerciseName, machineName, muscleGroup]);

  const fetchUserProfileAndCalculate = async () => {
    try {
      setLoading(true);
      console.log(`[Weight Rec] Calculating for ${machineName} - ${exerciseName}`);
      console.log(`[Weight Rec] Historical weight: ${historicalWeight || 'none'}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user profile data and weight stack in parallel
      const [profileResult, weightStackResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('weight_kg, age, gender, experience_level, primary_goal, current_max_weights')
          .eq('id', user.id)
          .single(),
        supabase
          .from('machine_weight_stacks')
          .select('weight_stack')
          .eq('machine_name', machineName)
          .maybeSingle()
      ]);

      if (profileResult.error) throw profileResult.error;
      if (!profileResult.data) throw new Error('Profile not found');

      const profile = profileResult.data;
      
      // Store weight stack if available
      if (weightStackResult.data?.weight_stack) {
        const stack = weightStackResult.data.weight_stack as number[];
        setWeightStack(stack);
        console.log(`[Weight Rec] Found weight stack: ${stack.join(', ')}`);
      }

      // Convert to UserWeightProfile format (kg to lbs)
      const userProfile: UserWeightProfile = {
        weight_lbs: (profile.weight_kg || 70) * 2.2, // Default 70kg if not set
        age: profile.age || 30, // Default age
        experience_level: (profile.experience_level as UserWeightProfile['experience_level']) || 'beginner',
        primary_goal: (profile.primary_goal as UserWeightProfile['primary_goal']) || 'general_fitness',
        gender: profile.gender || 'other',
        current_max_weights: (profile.current_max_weights as Record<string, number>) || {}
      };

      // Calculate weight recommendation
      let recommendedWeight = calculateOptimalWeight(userProfile, exerciseName, machineName);
      const originalRecommendedWeight = recommendedWeight;
      
      // Prioritize historical weight if available
      if (historicalWeight) {
        recommendedWeight = historicalWeight;
      }
      
      // Calculate sets and reps
      let { sets, reps, rest_seconds } = calculateSetsAndReps(
        userProfile.primary_goal,
        userProfile.experience_level,
        'compound' // Default to compound exercise
      );

      // If weight is same as last time and we have historical reps, use them
      if (historicalWeight && historicalReps && recommendedWeight === historicalWeight) {
        reps = historicalReps;
        console.log(`[Weight Rec] Using historical reps: ${reps}`);
      }

      // Check if we need to cap weight at machine max
      let atMachineMax = false;
      if (machineMaxWeight && recommendedWeight >= machineMaxWeight) {
        recommendedWeight = machineMaxWeight;
        atMachineMax = true;
        
        // If at machine max, recommend rep progression instead
        // Add 2-3 reps for progression
        if (historicalReps) {
          reps = Math.min(historicalReps + 2, 20); // Cap at 20 reps
          console.log(`[Weight Rec] At machine max (${machineMaxWeight} lbs). Progressing via reps: ${reps}`);
        }
      }

      // Snap recommended weight to available weight stack (if we have one)
      let snappedToStack = false;
      const currentWeightStack = weightStackResult.data?.weight_stack as number[] | null;
      if (currentWeightStack && currentWeightStack.length > 0 && !historicalWeight) {
        const snappedWeight = snapToAvailableWeight(recommendedWeight, currentWeightStack);
        if (snappedWeight !== recommendedWeight) {
          console.log(`[Weight Rec] Snapped ${recommendedWeight} lbs → ${snappedWeight} lbs (available in stack)`);
          recommendedWeight = snappedWeight;
          snappedToStack = true;
        }
      }

      // Determine confidence level
      let confidence: 'high' | 'medium' | 'learning' = 'learning';
      if (userProfile.current_max_weights && Object.keys(userProfile.current_max_weights).length > 2) {
        confidence = 'high';
      } else if (userProfile.experience_level !== 'beginner') {
        confidence = 'medium';
      }

      // Boost confidence if user has high power level
      if (powerLevel && powerLevel.current_score > 600) {
        confidence = confidence === 'learning' ? 'medium' : 'high';
      }

      const exerciseRecommendation: ExerciseWeightCalculation = {
        exercise_name: exerciseName,
        machine_name: machineName,
        recommended_weight: recommendedWeight,
        original_recommended_weight: snappedToStack ? originalRecommendedWeight : undefined,
        sets,
        reps,
        rest_seconds,
        confidence: historicalWeight ? 'high' : confidence, // Boost confidence if using history
        atMachineMax, // Flag to indicate we're at machine max
        snappedToStack // Flag to indicate weight was adjusted to match stack
      };

      console.log(`[Weight Rec] Recommendation: ${exerciseRecommendation.recommended_weight} lbs (${exerciseRecommendation.confidence} confidence)`);
      console.log(`[Weight Rec] Sets: ${exerciseRecommendation.sets}, Reps: ${exerciseRecommendation.reps}`);
      if (snappedToStack) {
        console.log(`[Weight Rec] Weight snapped to available stack value`);
      }

      setRecommendation(exerciseRecommendation);
      setError(null);
    } catch (err) {
      console.error('Error calculating weight recommendation:', err);
      setError('Failed to calculate recommendations');
      
      // Provide fallback recommendation
      setRecommendation({
        exercise_name: exerciseName,
        machine_name: machineName,
        recommended_weight: 80, // Safe default
        sets: 3,
        reps: 12,
        rest_seconds: 60,
        confidence: 'learning'
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'learning': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceDescription = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'Based on your workout history';
      case 'medium': return 'Estimated from your profile';
      case 'learning': return 'We\'ll adjust as we learn your preferences';
      default: return 'Calculating...';
    }
  };

  return {
    recommendation,
    loading,
    error,
    weightStack,
    getConfidenceColor,
    getConfidenceDescription,
    refetch: fetchUserProfileAndCalculate
  };
};