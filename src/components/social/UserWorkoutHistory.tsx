import { useState } from 'react';
import { useUserWorkoutHistory } from '@/hooks/useUserWorkoutHistory';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, Clock, Flame, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface UserWorkoutHistoryProps {
  userId: string;
}

export default function UserWorkoutHistory({ userId }: UserWorkoutHistoryProps) {
  const { workouts, loading } = useUserWorkoutHistory(userId);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No workouts logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => {
        const isExpanded = expandedWorkouts.has(workout.id);
        return (
          <Collapsible
            key={workout.id}
            open={isExpanded}
            onOpenChange={() => toggleWorkout(workout.id)}
          >
            <Card className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">{workout.muscleGroup}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(workout.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {workout.type}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{workout.duration} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="font-semibold">{workout.caloriesBurned}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Exercises</p>
                    <p className="font-semibold">{workout.exercisesCompleted}</p>
                  </div>
                </div>
              </div>

              {workout.exercises.length > 0 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Exercises
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View Exercises ({workout.exercises.length})
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}

              <CollapsibleContent className="mt-3 space-y-2">
                {workout.exercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-sm">{exercise.exercise_name}</h5>
                        <p className="text-xs text-muted-foreground">{exercise.machine_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Sets: </span>
                        <span className="font-semibold">{exercise.sets_completed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reps: </span>
                        <span className="font-semibold">{exercise.reps_completed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Weight: </span>
                        <span className="font-semibold">{exercise.weight_used} lbs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
