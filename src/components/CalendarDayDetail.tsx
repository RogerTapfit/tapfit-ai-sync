import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDay, WorkoutActivity, FoodActivity } from '@/hooks/useCalendarData';
import { 
  Dumbbell, 
  Utensils, 
  Clock, 
  Target, 
  Flame, 
  Activity,
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';

interface CalendarDayDetailProps {
  day: CalendarDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalendarDayDetail: React.FC<CalendarDayDetailProps> = ({
  day,
  open,
  onOpenChange,
}) => {
  if (!day) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWorkoutStatusIcon = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getWorkoutStatusColor = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'missed':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  const getMuscleGroupEmoji = (muscleGroup: string) => {
    const emojis: { [key: string]: string } = {
      chest: '💪',
      back: '🦵',
      shoulders: '🏋️',
      arms: '💪',
      legs: '🦵',
      core: '🎯',
      cardio: '❤️',
      full_body: '🔥',
    };
    return emojis[muscleGroup.toLowerCase()] || '🏃';
  };

  const getMealTypeEmoji = (mealType: string) => {
    const emojis: { [key: string]: string } = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
    };
    return emojis[mealType.toLowerCase()] || '🍽️';
  };

  const getHealthGradeColor = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a':
        return 'text-green-400';
      case 'b':
        return 'text-blue-400';
      case 'c':
        return 'text-yellow-400';
      case 'd':
      case 'f':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const isToday = day.dateString === new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glow-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {isToday && <span className="text-primary">•</span>}
            {formatDate(day.date)}
            {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Daily Stats Overview */}
          <Card className="glow-card p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Daily Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-calories">
                  {day.dailyStats.caloriesBurned}
                </div>
                <div className="text-sm text-muted-foreground">Burned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-heart">
                  {day.dailyStats.caloriesConsumed}
                </div>
                <div className="text-sm text-muted-foreground">Consumed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-exercises">
                  {day.dailyStats.exercisesCompleted}
                </div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stats-duration">
                  {day.dailyStats.workoutDuration}m
                </div>
                <div className="text-sm text-muted-foreground">Workout</div>
              </div>
            </div>
          </Card>

          {/* Workouts Section */}
          {day.workouts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Workouts ({day.workouts.length})
              </h3>
              <div className="space-y-3">
                {day.workouts.map((workout) => (
                  <Card key={workout.id} className={`p-4 border ${getWorkoutStatusColor(workout.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getWorkoutStatusIcon(workout.type)}
                          <span className="font-semibold">{workout.name}</span>
                          <span className="text-lg">{getMuscleGroupEmoji(workout.muscleGroup)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {workout.time || `${workout.duration}min`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {workout.exercises} exercises
                          </div>
                          {workout.calories && (
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {workout.calories} cal
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {workout.type}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Food Entries Section */}
          {day.foodEntries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Food Entries ({day.foodEntries.length})
              </h3>
              <div className="space-y-3">
                {day.foodEntries.map((food) => (
                  <Card key={food.id} className="p-4 glow-card">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getMealTypeEmoji(food.mealType)}</span>
                          <span className="font-semibold capitalize">{food.mealType}</span>
                          {food.healthGrade && (
                            <Badge variant="outline" className={getHealthGradeColor(food.healthGrade)}>
                              Grade {food.healthGrade}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {food.totalCalories} cal
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(food.time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {food.photoUrl && (
                            <div className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {food.photoUrl && (
                      <div className="mt-3">
                        <img 
                          src={food.photoUrl} 
                          alt="Food photo" 
                          className="rounded-lg max-h-32 object-cover"
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!day.hasActivity && (
            <Card className="p-8 text-center glow-card">
              <div className="space-y-3">
                <div className="text-4xl">😴</div>
                <h3 className="text-lg font-semibold text-muted-foreground">Rest Day</h3>
                <p className="text-sm text-muted-foreground">
                  No workouts or food logged on this day
                </p>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};