import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MachineHistoryData {
  lastWeight: number;
  lastReps: number;
  lastSets: number;
  lastWorkoutDate: string;
  exerciseName: string;
}

export const useMachineHistory = (machineName: string) => {
  const [history, setHistory] = useState<MachineHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLastWorkout = async () => {
      if (!machineName) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get the most recent exercise log for this machine
        const { data, error } = await supabase
          .from('exercise_logs')
          .select('exercise_name, machine_name, sets_completed, reps_completed, weight_used, completed_at')
          .eq('user_id', user.id)
          .eq('machine_name', machineName)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching machine history:', error);
          setHistory(null);
        } else if (data) {
          setHistory({
            lastWeight: data.weight_used || 0,
            lastReps: data.reps_completed || 0,
            lastSets: data.sets_completed || 0,
            lastWorkoutDate: data.completed_at,
            exerciseName: data.exercise_name
          });
        } else {
          setHistory(null);
        }
      } catch (err) {
        console.error('Error in useMachineHistory:', err);
        setHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLastWorkout();
  }, [machineName]);

  return { history, loading };
};
