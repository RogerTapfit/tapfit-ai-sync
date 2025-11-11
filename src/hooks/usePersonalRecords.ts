import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCoachingPhrase } from '@/services/workoutVoiceCoaching';

// Note: Voice coaching requires useWorkoutAudio hook to be available in the calling component

interface PersonalRecord {
  id: string;
  machineName: string;
  exerciseName: string;
  weightLbs: number;
  reps: number;
  sets: number;
  achievedAt: string;
  previousRecordWeight?: number;
  improvementPercentage?: number;
}

interface PRCheckResult {
  isNewPR: boolean;
  oldPR?: number;
  newPR?: number;
  improvement?: number;
}

export const usePersonalRecords = (machineName?: string, onNewPR?: (prData: PRCheckResult & { exerciseName: string }) => void) => {
  const [currentPR, setCurrentPR] = useState<PersonalRecord | null>(null);
  const [prHistory, setPRHistory] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (machineName) {
      fetchCurrentPR();
      fetchPRHistory();
    }
  }, [machineName]);

  const fetchCurrentPR = async () => {
    if (!machineName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('machine_name', machineName)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentPR({
          id: data.id,
          machineName: data.machine_name,
          exerciseName: data.exercise_name,
          weightLbs: data.weight_lbs,
          reps: data.reps,
          sets: data.sets,
          achievedAt: data.achieved_at,
          previousRecordWeight: data.previous_record_weight,
          improvementPercentage: data.improvement_percentage
        });
      } else {
        setCurrentPR(null);
      }
    } catch (err) {
      console.error('Error fetching current PR:', err);
      setCurrentPR(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPRHistory = async () => {
    if (!machineName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pr_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('machine_name', machineName)
        .order('achieved_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setPRHistory(
        data?.map(record => ({
          id: record.id,
          machineName: record.machine_name,
          exerciseName: record.exercise_name,
          weightLbs: record.weight_lbs,
          reps: record.reps,
          sets: record.sets,
          achievedAt: record.achieved_at
        })) || []
      );
    } catch (err) {
      console.error('Error fetching PR history:', err);
    }
  };

  const checkForNewPR = async (
    machineName: string,
    exerciseName: string,
    weightUsed: number,
    reps: number,
    sets: number
  ): Promise<PRCheckResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isNewPR: false };

      // Get current PR
      const { data: currentRecord } = await supabase
        .from('personal_records')
        .select('weight_lbs')
        .eq('user_id', user.id)
        .eq('machine_name', machineName)
        .maybeSingle();

      const oldPR = currentRecord?.weight_lbs || 0;
      const isNewPR = weightUsed > oldPR;

      if (isNewPR) {
        const improvement = oldPR > 0 
          ? Math.round(((weightUsed - oldPR) / oldPR) * 100) 
          : 100;

        // Update or create PR record
        const { error: upsertError } = await supabase
          .from('personal_records')
          .upsert({
            user_id: user.id,
            machine_name: machineName,
            exercise_name: exerciseName,
            weight_lbs: weightUsed,
            reps,
            sets,
            achieved_at: new Date().toISOString(),
            previous_record_weight: oldPR > 0 ? oldPR : null,
            improvement_percentage: improvement,
            celebrated: false
          }, {
            onConflict: 'user_id,machine_name'
          });

        if (upsertError) throw upsertError;

        // Mark previous history records as not current
        await supabase
          .from('pr_history')
          .update({ is_current_pr: false })
          .eq('user_id', user.id)
          .eq('machine_name', machineName);

        // Add to PR history
        const coinsAwarded = improvement >= 20 ? 100 : improvement >= 10 ? 50 : 25;
        
        await supabase
          .from('pr_history')
          .insert({
            user_id: user.id,
            machine_name: machineName,
            exercise_name: exerciseName,
            weight_lbs: weightUsed,
            reps,
            sets,
            achieved_at: new Date().toISOString(),
            is_current_pr: true,
            coins_awarded: coinsAwarded
          });

        // Award TapCoins
        await supabase.rpc('add_tap_coins', {
          _user_id: user.id,
          _amount: coinsAwarded,
          _transaction_type: 'personal_record',
          _description: `New PR on ${machineName}: ${weightUsed} lbs (+${improvement}%)`
        });

        // Trigger PR callback for voice coaching
        if (onNewPR) {
          onNewPR({ 
            isNewPR: true, 
            oldPR, 
            newPR: weightUsed, 
            improvement,
            exerciseName 
          });
        }

        return { isNewPR: true, oldPR, newPR: weightUsed, improvement };
      }

      return { isNewPR: false, oldPR };
    } catch (err) {
      console.error('Error checking for new PR:', err);
      return { isNewPR: false };
    }
  };

  const markCelebrated = async (prId: string) => {
    try {
      await supabase
        .from('personal_records')
        .update({ celebrated: true })
        .eq('id', prId);
    } catch (err) {
      console.error('Error marking PR as celebrated:', err);
    }
  };

  return {
    currentPR,
    prHistory,
    loading,
    checkForNewPR,
    markCelebrated,
    refetch: fetchCurrentPR
  };
};
