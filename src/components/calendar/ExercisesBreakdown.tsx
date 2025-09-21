import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Target, TrendingUp, Award, Clock, Zap, ArrowLeft, Weight } from 'lucide-react';
import { WorkoutActivity } from '@/hooks/useCalendarData';
import { supabase } from '@/integrations/supabase/client';

interface ExercisesBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workouts: WorkoutActivity[];
  totalExercises: number;
  date: Date;
}

interface ExerciseDetail {
  id: string;
  exercise_name: string;
  machine_name?: string;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number;
  completed_at: string;
  duration?: number;
}

export const ExercisesBreakdown: React.FC<ExercisesBreakdownProps> = ({
  open,
  onOpenChange,
  workouts,
  totalExercises,
  date,
}) => {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState<ExerciseDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExerciseDetails = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch exercise logs for the specific date
      const { data: exerciseLogs, error: logsError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString())
        .order('completed_at', { ascending: true });

      if (logsError) throw logsError;

      // Fetch smart pin data for the specific date
      const { data: smartPinData, error: pinError } = await supabase
        .from('smart_pin_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (pinError) throw pinError;

      // Combine both data sources
      const combinedDetails: ExerciseDetail[] = [
        ...(exerciseLogs || []).map(log => ({
          id: log.id,
          exercise_name: log.exercise_name,
          machine_name: log.machine_name,
          sets_completed: log.sets_completed,
          reps_completed: log.reps_completed,
          weight_used: log.weight_used,
          completed_at: log.completed_at,
        })),
        ...(smartPinData || []).map(pin => ({
          id: pin.id,
          exercise_name: pin.machine_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          machine_name: pin.machine_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          sets_completed: pin.sets,
          reps_completed: pin.reps,
          weight_used: pin.weight,
          completed_at: pin.created_at,
          duration: pin.duration,
        }))
      ].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

      setExerciseDetails(combinedDetails);
    } catch (error) {
      console.error('Error fetching exercise details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = () => {
    setShowDetailedView(true);
    fetchExerciseDetails();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowDetailedView(false);
      setExerciseDetails([]);
    }
    onOpenChange(open);
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const completedWorkouts = workouts.filter(w => w.type === 'completed');
  const scheduledWorkouts = workouts.filter(w => w.type === 'scheduled');
  const missedWorkouts = workouts.filter(w => w.type === 'missed');

  const getMuscleGroupIcon = (muscleGroup: string) => {
    const icons: Record<string, React.ReactNode> = {
      'chest': <Target className="h-4 w-4" />,
      'back': <TrendingUp className="h-4 w-4" />,
      'legs': <Zap className="h-4 w-4" />,
      'shoulders': <Award className="h-4 w-4" />,
      'arms': <Dumbbell className="h-4 w-4" />,
      'core': <Target className="h-4 w-4" />,
      'cardio': <Zap className="h-4 w-4" />,
    };
    return icons[muscleGroup.toLowerCase()] || <Dumbbell className="h-4 w-4" />;
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: Record<string, string> = {
      'chest': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'back': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'legs': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'shoulders': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'arms': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'core': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'cardio': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
    };
    return colors[muscleGroup.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getWorkoutStatusColor = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return 'border-green-500/20 bg-green-500/5';
      case 'scheduled':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'missed':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const totalDuration = completedWorkouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);
  const avgDuration = completedWorkouts.length > 0 ? Math.round(totalDuration / completedWorkouts.length) : 0;

  // Calculate muscle group distribution
  const muscleGroupCounts = completedWorkouts.reduce((acc, workout) => {
    const group = workout.muscleGroup || 'other';
    acc[group] = (acc[group] || 0) + (workout.exercises || 1);
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showDetailedView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailedView(false)}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Dumbbell className="h-5 w-5 text-primary" />
            {showDetailedView ? 'Exercise Details' : 'Exercises Completed'} - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        {showDetailedView ? (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {/* Exercise Details List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Weight className="h-5 w-5 text-primary" />
                    Individual Exercise Breakdown ({exerciseDetails.length})
                  </h3>
                  
                  {exerciseDetails.length > 0 ? (
                    <div className="space-y-3">
                      {exerciseDetails.map((exercise, index) => (
                        <Card key={exercise.id} className="p-4 border-l-4 border-l-primary">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{exercise.exercise_name}</h4>
                              {exercise.machine_name && (
                                <p className="text-sm text-muted-foreground mb-2">{exercise.machine_name}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Dumbbell className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{exercise.sets_completed}</span>
                                  <span className="text-muted-foreground">sets</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">{exercise.reps_completed}</span>
                                  <span className="text-muted-foreground">reps</span>
                                </div>
                                {exercise.weight_used && (
                                  <div className="flex items-center gap-1">
                                    <Weight className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">{exercise.weight_used}</span>
                                    <span className="text-muted-foreground">lbs</span>
                                  </div>
                                )}
                                {exercise.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">{Math.round(exercise.duration)}</span>
                                    <span className="text-muted-foreground">sec</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {new Date(exercise.completed_at).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                              <Badge variant="outline" className="mt-1">
                                #{index + 1}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 text-center">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">No Exercise Details Found</h3>
                      <p className="text-sm text-muted-foreground">
                        No detailed exercise data available for this day
                      </p>
                    </Card>
                  )}
                </div>

                {/* Summary Stats for Detailed View */}
                {exerciseDetails.length > 0 && (
                  <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Detailed Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-primary">
                          {exerciseDetails.reduce((sum, ex) => sum + ex.sets_completed, 0)}
                        </div>
                        <div className="text-muted-foreground">Total Sets</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-primary">
                          {exerciseDetails.reduce((sum, ex) => sum + ex.reps_completed, 0)}
                        </div>
                        <div className="text-muted-foreground">Total Reps</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-primary">
                          {Math.round(exerciseDetails.reduce((sum, ex) => sum + (ex.weight_used || 0), 0) / exerciseDetails.filter(ex => ex.weight_used).length) || 0}
                        </div>
                        <div className="text-muted-foreground">Avg Weight</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-primary">
                          {exerciseDetails.reduce((sum, ex) => sum + (ex.weight_used || 0) * ex.reps_completed, 0)}
                        </div>
                        <div className="text-muted-foreground">Total Volume</div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors" 
              onClick={handleShowDetails}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalExercises}</div>
                <div className="text-sm text-muted-foreground">Total Exercises</div>
                <div className="text-xs text-primary mt-1">Click for details</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedWorkouts.length}</div>
                <div className="text-sm text-muted-foreground">Workouts</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalDuration}</div>
                <div className="text-sm text-muted-foreground">Total Minutes</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-500/5 to-amber-600/10 border-amber-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgDuration}</div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </Card>
          </div>

          {/* Muscle Group Distribution */}
          {Object.keys(muscleGroupCounts).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Muscle Group Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(muscleGroupCounts).map(([group, count]) => (
                  <Card key={group} className="p-3 text-center hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-center mb-2 text-primary">
                      {getMuscleGroupIcon(group)}
                    </div>
                    <div className="font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">{group}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Workouts */}
          {completedWorkouts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                Completed Workouts ({completedWorkouts.length})
              </h3>
              <div className="space-y-3">
                {completedWorkouts.map((workout, index) => (
                  <Card 
                    key={index} 
                    className={`p-4 ${getWorkoutStatusColor(workout.type)} hover:bg-accent/50 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getMuscleGroupIcon(workout.muscleGroup)}
                        <div>
                          <h4 className="font-medium">{workout.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge 
                              variant="outline" 
                              className={getMuscleGroupColor(workout.muscleGroup)}
                            >
                              {workout.muscleGroup}
                            </Badge>
                            {workout.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {workout.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          {workout.exercises || 1} exercise{(workout.exercises || 1) !== 1 ? 's' : ''}
                        </div>
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Workouts */}
          {scheduledWorkouts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Scheduled Workouts ({scheduledWorkouts.length})
              </h3>
              <div className="space-y-3">
                {scheduledWorkouts.map((workout, index) => (
                  <Card 
                    key={index} 
                    className={`p-4 ${getWorkoutStatusColor(workout.type)} hover:bg-accent/50 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getMuscleGroupIcon(workout.muscleGroup)}
                        <div>
                          <h4 className="font-medium">{workout.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge 
                              variant="outline" 
                              className={getMuscleGroupColor(workout.muscleGroup)}
                            >
                              {workout.muscleGroup}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {workout.exercises || 1} exercise{(workout.exercises || 1) !== 1 ? 's' : ''}
                        </div>
                        <Badge variant="secondary">
                          Scheduled
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalExercises === 0 && (
            <Card className="p-6 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Exercises Completed</h3>
              <p className="text-sm text-muted-foreground">
                No workouts or exercises were completed on this day
              </p>
            </Card>
          )}

          {/* Performance Summary */}
          {completedWorkouts.length > 0 && (
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Daily Performance Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-primary">{completedWorkouts.length}</div>
                  <div className="text-muted-foreground">Workouts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{totalExercises}</div>
                  <div className="text-muted-foreground">Exercises</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{totalDuration}m</div>
                  <div className="text-muted-foreground">Duration</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{Object.keys(muscleGroupCounts).length}</div>
                  <div className="text-muted-foreground">Muscle Groups</div>
                </div>
              </div>
            </Card>
           )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};