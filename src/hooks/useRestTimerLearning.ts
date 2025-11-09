import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RestPreference {
  preferred_rest_seconds: number;
  avg_actual_rest_seconds: number;
  total_samples: number;
}

interface RestSuggestion {
  suggestedRestSeconds: number;
  reason: string;
  intensityFactor: number;
}

export const useRestTimerLearning = (exerciseName: string, machineName: string) => {
  const [restPreference, setRestPreference] = useState<RestPreference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestPreference();
  }, [exerciseName]);

  const fetchRestPreference = async () => {
    if (!exerciseName) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('exercise_rest_preferences')
        .select('preferred_rest_seconds, avg_actual_rest_seconds, total_samples')
        .eq('user_id', user.id)
        .eq('exercise_name', exerciseName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching rest preference:', error);
      } else if (data) {
        setRestPreference(data);
      }
    } catch (err) {
      console.error('Error in fetchRestPreference:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSuggestedRest = (
    currentWeight: number,
    maxWeight: number,
    setNumber: number,
    totalSets: number
  ): RestSuggestion => {
    const baseRest = restPreference?.preferred_rest_seconds || 60;
    
    // Calculate intensity factor (0.5 to 1.5)
    const intensityRatio = maxWeight > 0 ? currentWeight / maxWeight : 0.7;
    
    // Weight intensity multiplier
    let intensityFactor = 1.0;
    if (intensityRatio >= 0.9) {
      intensityFactor = 1.4; // Very heavy: +40% rest
    } else if (intensityRatio >= 0.8) {
      intensityFactor = 1.2; // Heavy: +20% rest
    } else if (intensityRatio >= 0.6) {
      intensityFactor = 1.0; // Moderate: baseline rest
    } else {
      intensityFactor = 0.8; // Light: -20% rest
    }
    
    // Set number multiplier (later sets need more rest)
    const setProgress = setNumber / totalSets;
    const setMultiplier = 1 + (setProgress * 0.2); // Up to +20% for final sets
    
    // Combined calculation
    const suggestedRest = Math.round(baseRest * intensityFactor * setMultiplier);
    
    // Determine reason
    let reason = '';
    if (intensityRatio >= 0.9) {
      reason = 'Heavy weight - extended rest recommended';
    } else if (setProgress > 0.66) {
      reason = 'Final sets - extra recovery time';
    } else if (restPreference && restPreference.total_samples >= 3) {
      reason = `Based on your ${restPreference.total_samples} previous workouts`;
    } else {
      reason = 'Standard rest period';
    }
    
    return {
      suggestedRestSeconds: Math.max(30, Math.min(180, suggestedRest)), // Clamp 30-180s
      reason,
      intensityFactor
    };
  };

  const updateRestPreference = async (actualRestSeconds: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current preference or create new
      const { data: existing } = await supabase
        .from('exercise_rest_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_name', exerciseName)
        .single();

      if (existing) {
        // Update with exponential moving average
        const newSamples = existing.total_samples + 1;
        const alpha = Math.min(0.3, 2.0 / (newSamples + 1)); // EMA smoothing factor
        const newAvg = Math.round(
          existing.avg_actual_rest_seconds * (1 - alpha) + actualRestSeconds * alpha
        );

        await supabase
          .from('exercise_rest_preferences')
          .update({
            preferred_rest_seconds: newAvg,
            avg_actual_rest_seconds: newAvg,
            total_samples: newSamples,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('exercise_name', exerciseName);

        // Update local state
        setRestPreference({
          preferred_rest_seconds: newAvg,
          avg_actual_rest_seconds: newAvg,
          total_samples: newSamples
        });
      } else {
        // Create new preference
        const { data: newPref } = await supabase
          .from('exercise_rest_preferences')
          .insert({
            user_id: user.id,
            exercise_name: exerciseName,
            machine_name: machineName,
            preferred_rest_seconds: actualRestSeconds,
            avg_actual_rest_seconds: actualRestSeconds,
            total_samples: 1
          })
          .select('preferred_rest_seconds, avg_actual_rest_seconds, total_samples')
          .single();

        if (newPref) {
          setRestPreference(newPref);
        }
      }
    } catch (err) {
      console.error('Error updating rest preference:', err);
    }
  };

  const manuallySetPreference = async (newRestSeconds: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('exercise_rest_preferences')
        .upsert({
          user_id: user.id,
          exercise_name: exerciseName,
          machine_name: machineName,
          preferred_rest_seconds: newRestSeconds,
          avg_actual_rest_seconds: newRestSeconds,
          total_samples: 0, // Manual override doesn't count as a sample
          last_updated: new Date().toISOString()
        });

      if (!error) {
        setRestPreference({
          preferred_rest_seconds: newRestSeconds,
          avg_actual_rest_seconds: newRestSeconds,
          total_samples: 0
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error manually setting rest preference:', err);
      return false;
    }
  };

  return {
    restPreference,
    loading,
    calculateSuggestedRest,
    updateRestPreference,
    manuallySetPreference
  };
};