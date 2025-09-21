import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Dumbbell, Heart, Clock } from 'lucide-react';
import { WorkoutActivity } from '@/hooks/useCalendarData';

interface BurnedCaloriesBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workouts: WorkoutActivity[];
  totalCalories: number;
  date: Date;
}

export const BurnedCaloriesBreakdown: React.FC<BurnedCaloriesBreakdownProps> = ({
  open,
  onOpenChange,
  workouts,
  totalCalories,
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

  const getWorkoutTypeIcon = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return <Dumbbell className="h-4 w-4 text-primary" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Heart className="h-4 w-4 text-destructive" />;
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

  const completedWorkouts = workouts.filter(w => w.type === 'completed');
  const baseMetabolicRate = Math.floor(totalCalories * 0.3); // Approximate BMR portion
  const exerciseCalories = totalCalories - baseMetabolicRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-destructive" />
            Calories Burned - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{totalCalories}</div>
                <div className="text-sm text-muted-foreground">Total Burned</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{exerciseCalories}</div>
                <div className="text-sm text-muted-foreground">Exercise</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-foreground">{baseMetabolicRate}</div>
                <div className="text-sm text-muted-foreground">Base Rate</div>
              </div>
            </Card>
          </div>

          {/* Workout Breakdown */}
          {completedWorkouts.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Workout Breakdown</h3>
              {completedWorkouts.map((workout, index) => (
                <Card key={index} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getWorkoutTypeIcon(workout.type)}
                      <div>
                        <h4 className="font-medium">{workout.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className={getMuscleGroupColor(workout.muscleGroup)}>
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
                      <div className="font-semibold text-destructive">
                        ~{Math.floor(exerciseCalories / completedWorkouts.length)} cal
                      </div>
                      {workout.exercises && (
                        <div className="text-sm text-muted-foreground">
                          {workout.exercises} exercises
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Workouts Completed</h3>
              <p className="text-sm text-muted-foreground">
                Calories burned from base metabolic rate only
              </p>
            </Card>
          )}

          {/* Calorie Breakdown Chart */}
          <div className="space-y-2">
            <h4 className="font-medium">Daily Calorie Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <span className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-destructive" />
                  Exercise & Activity
                </span>
                <span className="font-semibold">{exerciseCalories} cal ({Math.round((exerciseCalories / totalCalories) * 100)}%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-secondary-foreground" />
                  Base Metabolic Rate
                </span>
                <span className="font-semibold">{baseMetabolicRate} cal ({Math.round((baseMetabolicRate / totalCalories) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};