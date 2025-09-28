import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateOptimalWeight, 
  calculateSetsAndReps,
  UserWeightProfile,
  ExerciseWeightCalculation
} from '@/services/weightCalculationService';
import { usePowerLevel } from './usePowerLevel';

interface UseWeightRecommendationProps {
  exerciseName: string;
  machineName: string;
  muscleGroup: string;
}

export const useWeightRecommendation = ({ 
  exerciseName, 
  machineName, 
  muscleGroup 
}: UseWeightRecommendationProps) => {
  const [recommendation, setRecommendation] = useState<ExerciseWeightCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { powerLevel } = usePowerLevel();

  useEffect(() => {
    fetchUserProfileAndCalculate();
  }, [exerciseName, machineName, muscleGroup]);

  const fetchUserProfileAndCalculate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weight_kg, age, gender, experience_level, primary_goal, current_max_weights')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

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
      const recommendedWeight = calculateOptimalWeight(userProfile, exerciseName, machineName);
      
      // Calculate sets and reps
      const { sets, reps, rest_seconds } = calculateSetsAndReps(
        userProfile.primary_goal,
        userProfile.experience_level,
        'compound' // Default to compound exercise
      );

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
        sets,
        reps,
        rest_seconds,
        confidence
      };

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
    getConfidenceColor,
    getConfidenceDescription,
    refetch: fetchUserProfileAndCalculate
  };
};