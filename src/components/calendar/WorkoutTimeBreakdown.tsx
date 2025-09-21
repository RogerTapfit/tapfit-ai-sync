import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, CheckCircle, Calendar, Timer } from 'lucide-react';
import { WorkoutActivity } from '@/hooks/useCalendarData';

interface WorkoutTimeBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workouts: WorkoutActivity[];
  totalTime: number;
  date: Date;
}

export const WorkoutTimeBreakdown: React.FC<WorkoutTimeBreakdownProps> = ({
  open,
  onOpenChange,
  workouts,
  totalTime,
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const completedWorkouts = workouts.filter(w => w.type === 'completed');
  const scheduledWorkouts = workouts.filter(w => w.type === 'scheduled');
  
  const getWorkoutTypeIcon = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'missed':
        return <Pause className="h-4 w-4 text-red-500" />;
      default:
        return <Play className="h-4 w-4 text-gray-500" />;
    }
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

  const averageWorkoutTime = completedWorkouts.length > 0 
    ? Math.round(totalTime / completedWorkouts.length) 
    : 0;

  const longestWorkout = completedWorkouts.reduce((max, workout) => 
    (workout.duration || 0) > max ? (workout.duration || 0) : max, 0
  );

  const shortestWorkout = completedWorkouts.length > 0
    ? completedWorkouts.reduce((min, workout) => 
        (workout.duration || 0) < min ? (workout.duration || 0) : min, longestWorkout
      )
    : 0;

  // Calculate time distribution by muscle group
  const timeByMuscleGroup = completedWorkouts.reduce((acc, workout) => {
    const group = workout.muscleGroup || 'other';
    acc[group] = (acc[group] || 0) + (workout.duration || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Workout Time - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatDuration(totalTime)}</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatDuration(averageWorkoutTime)}</div>
                <div className="text-sm text-muted-foreground">Average</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatDuration(longestWorkout)}</div>
                <div className="text-sm text-muted-foreground">Longest</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-500/5 to-amber-600/10 border-amber-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatDuration(shortestWorkout)}</div>
                <div className="text-sm text-muted-foreground">Shortest</div>
              </div>
            </Card>
          </div>

          {/* Time by Muscle Group */}
          {Object.keys(timeByMuscleGroup).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Time Distribution by Muscle Group</h3>
              <div className="space-y-2">
                {Object.entries(timeByMuscleGroup)
                  .sort(([,a], [,b]) => b - a)
                  .map(([group, time]) => (
                  <div key={group} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={getMuscleGroupColor(group)}
                      >
                        {group}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatDuration(time)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({Math.round((time / totalTime) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Workouts Timeline */}
          {completedWorkouts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Timer className="h-5 w-5 text-green-500" />
                Completed Workout Sessions ({completedWorkouts.length})
              </h3>
              <div className="space-y-3">
                {completedWorkouts.map((workout, index) => (
                  <Card 
                    key={index} 
                    className={`p-4 ${getWorkoutStatusColor(workout.type)} hover:bg-accent/50 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getWorkoutTypeIcon(workout.type)}
                        <div>
                          <h4 className="font-medium">{workout.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge 
                              variant="outline" 
                              className={getMuscleGroupColor(workout.muscleGroup)}
                            >
                              {workout.muscleGroup}
                            </Badge>
                            {workout.exercises && (
                              <span>{workout.exercises} exercises</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(workout.duration || 0)}
                        </div>
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          Completed
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Session Progress</span>
                        <span>{workout.duration || 0} minutes</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ 
                            width: totalTime > 0 ? `${Math.min(((workout.duration || 0) / totalTime) * 100, 100)}%` : '0%' 
                          }}
                        />
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
                <Calendar className="h-5 w-5 text-blue-500" />
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
                        {getWorkoutTypeIcon(workout.type)}
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
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          {workout.duration ? `~${formatDuration(workout.duration)}` : 'Est. 45m'}
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
          {totalTime === 0 && (
            <Card className="p-6 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Workout Time Logged</h3>
              <p className="text-sm text-muted-foreground">
                No completed workouts were recorded for this day
              </p>
            </Card>
          )}

          {/* Daily Summary */}
          {totalTime > 0 && (
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Daily Workout Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-primary">{completedWorkouts.length}</div>
                  <div className="text-muted-foreground">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{formatDuration(totalTime)}</div>
                  <div className="text-muted-foreground">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{formatDuration(averageWorkoutTime)}</div>
                  <div className="text-muted-foreground">Avg Session</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{Object.keys(timeByMuscleGroup).length}</div>
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