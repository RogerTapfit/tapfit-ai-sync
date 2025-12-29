import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Clock, Flame, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getMachineImageUrl } from '@/utils/machineImageUtils';
import { PRBadge } from './PRBadge';

interface DayWorkoutDetailProps {
  date: Date;
  workoutIds: string[];
  onClose: () => void;
}

interface ExerciseDetail {
  id: string;
  exercise_name: string;
  machine_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number;
  is_pr?: boolean;
}

interface WorkoutDetail {
  id: string;
  workout_name: string;
  muscle_group: string;
  completed_at: string;
  duration_minutes: number;
  calories_burned: number;
  exercises: ExerciseDetail[];
}

export const DayWorkoutDetail = ({ date, workoutIds, onClose }: DayWorkoutDetailProps) => {
  const [workouts, setWorkouts] = useState<WorkoutDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (workoutIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch workout logs
        const { data: workoutLogs, error: workoutError } = await supabase
          .from('workout_logs')
          .select('id, workout_name, muscle_group, completed_at, duration_minutes, calories_burned')
          .in('id', workoutIds);

        if (workoutError) throw workoutError;
        if (!workoutLogs) {
          setLoading(false);
          return;
        }

        // Fetch exercise logs for each workout
        const { data: exerciseLogs, error: exerciseError } = await supabase
          .from('exercise_logs')
          .select('id, workout_log_id, exercise_name, machine_name, sets_completed, reps_completed, weight_used')
          .in('workout_log_id', workoutIds);

        if (exerciseError) throw exerciseError;

        // Fetch PRs for this user on this date
        const { data: { user } } = await supabase.auth.getUser();
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const { data: prs } = await supabase
          .from('personal_records')
          .select('exercise_name')
          .eq('user_id', user?.id)
          .gte('achieved_at', `${dateStr}T00:00:00`)
          .lte('achieved_at', `${dateStr}T23:59:59`);

        const prExercises = new Set(prs?.map(p => p.exercise_name) || []);

        // Combine data
        const workoutsWithExercises: WorkoutDetail[] = workoutLogs.map(workout => ({
          id: workout.id,
          workout_name: workout.workout_name || 'Workout',
          muscle_group: workout.muscle_group || 'strength',
          completed_at: workout.completed_at || '',
          duration_minutes: workout.duration_minutes || 0,
          calories_burned: workout.calories_burned || 0,
          exercises: (exerciseLogs || [])
            .filter(e => e.workout_log_id === workout.id)
            .map(e => ({
              id: e.id,
              exercise_name: e.exercise_name,
              machine_name: e.machine_name || e.exercise_name,
              sets_completed: e.sets_completed || 0,
              reps_completed: e.reps_completed || 0,
              weight_used: e.weight_used || 0,
              is_pr: prExercises.has(e.exercise_name)
            }))
        }));

        setWorkouts(workoutsWithExercises);
      } catch (err) {
        console.error('Error fetching workout details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutDetails();
  }, [workoutIds, date]);

  const totalVolume = workouts.reduce((sum, w) => 
    sum + w.exercises.reduce((eSum, e) => 
      eSum + (e.weight_used || 0) * (e.reps_completed || 0) * (e.sets_completed || 1), 0
    ), 0
  );

  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-4 border-t border-border/50 pt-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-foreground">
              {format(date, 'EEEE, MMMM d')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} • {totalExercises} exercises
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No workout data found</p>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout, wIdx) => (
              <div key={workout.id} className="bg-background/50 rounded-lg border border-border/50 overflow-hidden">
                {/* Workout Header */}
                <div className="p-3 bg-muted/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{workout.workout_name}</span>
                      <Badge variant="secondary" className="capitalize">
                        {workout.muscle_group || 'strength'}
                      </Badge>
                      {workout.duration_minutes > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {workout.calories_burned > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {workout.calories_burned} cal
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exercises */}
                <div className="p-3 space-y-3">
                  {workout.exercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No exercises logged
                    </p>
                  ) : (
                    workout.exercises.map((exercise, eIdx) => {
                      const volume = (exercise.weight_used || 0) * (exercise.reps_completed || 0) * (exercise.sets_completed || 1);
                      
                      return (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: eIdx * 0.05 }}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          {/* Machine Image */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border/50">
                            <img 
                              src={getMachineImageUrl(exercise.machine_name || exercise.exercise_name)} 
                              alt={exercise.machine_name}
                              className="w-full h-full object-contain bg-background/30"
                            />
                          </div>

                          {/* Exercise Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-sm truncate">{exercise.exercise_name}</h5>
                              {exercise.is_pr && <PRBadge variant="compact" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {exercise.machine_name}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-semibold text-primary">
                              {exercise.sets_completed || 0} × {exercise.reps_completed || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exercise.weight_used || 0} lbs
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}

            {/* Total Volume Summary */}
            {totalVolume > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Day Total Volume
                </span>
                <span className="text-lg font-bold text-primary">
                  {totalVolume.toLocaleString()} lbs
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
