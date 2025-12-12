import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MachineHistoryData {
  lastWeight: number;
  lastReps: number;
  lastSets: number;
  lastWorkoutDate: string;
  exerciseName: string;
  shouldProgressWeight?: boolean;
  suggestedWeight?: number;
  consecutiveSuccessfulWorkouts?: number;
  // User's typical performance on this machine
  typicalWeight?: number;
  typicalReps?: number;
  personalMaxWeight?: number;
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

        // Get the last 3 workouts for this machine to detect progressive overload opportunity
        // Include workout_logs context to show where the workout came from
        const { data: recentWorkouts, error } = await supabase
          .from('exercise_logs')
          .select(`
            exercise_name, 
            machine_name, 
            sets_completed, 
            reps_completed, 
            weight_used, 
            completed_at,
            workout_logs!inner(
              workout_name,
              muscle_group
            )
          `)
          .eq('user_id', user.id)
          .eq('machine_name', machineName)
          .order('completed_at', { ascending: false })
          .limit(3);
        
        console.log(`[Machine History] Fetching history for: ${machineName}`);
        console.log(`[Machine History] Found ${recentWorkouts?.length || 0} previous workouts`);

        if (error) {
          console.error('Error fetching machine history:', error);
          setHistory(null);
        } else if (recentWorkouts && recentWorkouts.length > 0) {
          const lastWorkout = recentWorkouts[0];
          
          // Check for progressive overload opportunity
          // Criteria: Last 2+ workouts completed all sets at same weight
          let shouldProgressWeight = false;
          let consecutiveSuccessful = 0;
          
          if (recentWorkouts.length >= 2) {
            const sameWeight = recentWorkouts[0].weight_used;
            let allSameWeight = true;
            let allCompleted = true;
            
            for (let i = 0; i < Math.min(3, recentWorkouts.length); i++) {
              const workout = recentWorkouts[i];
              const completedAllSets = workout.sets_completed >= 3; // Assume 3 sets as standard
              
              if (workout.weight_used === sameWeight && completedAllSets) {
                consecutiveSuccessful++;
              } else if (workout.weight_used !== sameWeight) {
                allSameWeight = false;
                break;
              } else if (!completedAllSets) {
                allCompleted = false;
                break;
              }
            }
            
            // Suggest progression if 2+ consecutive successful workouts at same weight
            shouldProgressWeight = allSameWeight && allCompleted && consecutiveSuccessful >= 2;
          }
          
          // Calculate suggested weight (5-10% increase, rounded to nearest 5 lbs)
          const increasePercentage = 0.075; // 7.5% average
          const rawIncrease = lastWorkout.weight_used * increasePercentage;
          const suggestedWeight = Math.round((lastWorkout.weight_used + rawIncrease) / 5) * 5;
          
          // Calculate typical weight and reps from last 3 workouts
          const avgWeight = recentWorkouts.reduce((sum, w) => sum + (w.weight_used || 0), 0) / recentWorkouts.length;
          const avgReps = recentWorkouts.reduce((sum, w) => sum + (w.reps_completed || 0), 0) / recentWorkouts.length;
          const maxWeight = Math.max(...recentWorkouts.map(w => w.weight_used || 0));
          
          setHistory({
            lastWeight: lastWorkout.weight_used || 0,
            lastReps: lastWorkout.reps_completed || 0,
            lastSets: lastWorkout.sets_completed || 0,
            lastWorkoutDate: lastWorkout.completed_at,
            exerciseName: lastWorkout.exercise_name,
            shouldProgressWeight,
            suggestedWeight,
            consecutiveSuccessfulWorkouts: consecutiveSuccessful,
            typicalWeight: Math.round(avgWeight),
            typicalReps: Math.round(avgReps),
            personalMaxWeight: maxWeight
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
