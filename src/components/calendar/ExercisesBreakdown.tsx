import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Target, TrendingUp, Award, Clock, Zap } from 'lucide-react';
import { WorkoutActivity } from '@/hooks/useCalendarData';

interface ExercisesBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workouts: WorkoutActivity[];
  totalExercises: number;
  date: Date;
}

export const ExercisesBreakdown: React.FC<ExercisesBreakdownProps> = ({
  open,
  onOpenChange,
  workouts,
  totalExercises,
  date,
}) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Exercises Completed - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalExercises}</div>
                <div className="text-sm text-muted-foreground">Total Exercises</div>
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
      </DialogContent>
    </Dialog>
  );
};