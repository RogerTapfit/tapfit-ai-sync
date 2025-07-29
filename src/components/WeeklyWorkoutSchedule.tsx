import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Dumbbell,
  Timer,
  List
} from 'lucide-react';
import { useWorkoutPlan, ScheduledWorkout } from '@/hooks/useWorkoutPlan';
import WorkoutBreakdown from './WorkoutBreakdown';
import { format, isToday, isPast } from 'date-fns';

const WeeklyWorkoutSchedule = () => {
  const { currentPlan, weeklySchedule, markWorkoutComplete, rescheduleWorkout } = useWorkoutPlan();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduledWorkout | null>(null);

  if (!currentPlan) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No workout plan found. Generate one first!</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (workout: ScheduledWorkout) => {
    switch (workout.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'rescheduled':
        return <RotateCcw className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (workout: ScheduledWorkout) => {
    if (workout.status === 'completed') return 'bg-green-50 border-green-200';
    if (workout.status === 'missed') return 'bg-red-50 border-red-200';
    if (workout.scheduled_date && isPast(new Date(workout.scheduled_date)) && workout.status === 'scheduled') {
      return 'bg-amber-50 border-amber-200';
    }
    if (workout.scheduled_date && isToday(new Date(workout.scheduled_date))) {
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-card border-border';
  };

  const formatMuscleGroup = (muscleGroup: string) => {
    return muscleGroup.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' & ');
  };

  if (showBreakdown) {
    return (
      <WorkoutBreakdown 
        workout={selectedWorkout} 
        onBack={() => {
          setShowBreakdown(false);
          setSelectedWorkout(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            This Week's Schedule
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Plan: {currentPlan.name}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklySchedule.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No workouts scheduled for this week
              </p>
            ) : (
              weeklySchedule.map((workout) => (
                <Card 
                  key={workout.id} 
                  className={`${getStatusColor(workout)} transition-colors`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(workout)}
                        <div>
                          <h3 className="font-semibold capitalize">
                            {workout.day}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {workout.scheduled_date && format(new Date(workout.scheduled_date), 'MMM d')} at {workout.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        <Target className="h-3 w-3 mr-1" />
                        {formatMuscleGroup(workout.muscle_group)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {workout.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {workout.exercises?.length || 0} exercises
                      </span>
                    </div>

                    {workout.exercises && workout.exercises.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium">Exercises:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {workout.exercises.map((exercise, index) => (
                            <div 
                              key={index} 
                              className="text-sm p-2 bg-muted rounded-md"
                            >
                              <div className="font-medium">{exercise.machine}</div>
                              <div className="text-muted-foreground">
                                {exercise.sets} sets × {exercise.reps} reps
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWorkout(workout);
                          setShowBreakdown(true);
                        }}
                        className="flex-1"
                      >
                        <List className="h-3 w-3 mr-1" />
                        Preview Workout
                      </Button>
                      
                      {workout.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // This would open a reschedule dialog
                            // For now, just reschedule to tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            workout.id && rescheduleWorkout(
                              workout.id, 
                              tomorrow.toISOString().split('T')[0], 
                              workout.time
                            );
                          }}
                          className="flex-1"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reschedule
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyWorkoutSchedule;