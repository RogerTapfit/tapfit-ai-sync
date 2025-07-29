import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
import { ScheduledWorkout } from '@/hooks/useWorkoutPlan';

interface WorkoutBreakdownProps {
  workout: ScheduledWorkout | null;
  onBack: () => void;
}

const WorkoutBreakdown: React.FC<WorkoutBreakdownProps> = ({ workout, onBack }) => {
  if (!workout) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workout Plan
        </Button>
        <div className="text-center text-muted-foreground">
          No workout selected
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workout Plan
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{workout.duration} min</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold capitalize">
          {workout.day}'s {workout.muscle_group.replace('_', ' ')} Exercises
        </h2>
        <p className="text-muted-foreground">
          Complete the exercises below in order
        </p>
      </div>

      <div className="space-y-2">
        {workout.exercises.map((exercise, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
            onClick={() => {
              // Handle exercise click - could mark as complete, show details, etc.
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-destructive/20 border border-destructive/30 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">
                  {exercise.machine}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Target: {workout.muscle_group.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                {exercise.duration_minutes ? (
                  <p className="text-sm font-medium text-foreground">
                    {exercise.duration_minutes} min
                  </p>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {exercise.sets}×{exercise.reps}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                Pending
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Workout Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Warm up for 5-10 minutes before starting
          </p>
          <p className="text-sm text-muted-foreground">
            • Focus on proper form over heavy weight
          </p>
          <p className="text-sm text-muted-foreground">
            • Stay hydrated throughout your workout
          </p>
          <p className="text-sm text-muted-foreground">
            • Cool down and stretch after completing the session
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutBreakdown;