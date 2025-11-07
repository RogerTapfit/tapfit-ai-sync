import { useUserWorkoutHistory } from '@/hooks/useUserWorkoutHistory';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, Clock, Flame, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface UserWorkoutHistoryProps {
  userId: string;
}

export default function UserWorkoutHistory({ userId }: UserWorkoutHistoryProps) {
  const { workouts, loading } = useUserWorkoutHistory(userId);

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
      {workouts.map((workout) => (
        <Card key={workout.id} className="p-4 hover:bg-accent/50 transition-colors">
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

          <div className="grid grid-cols-3 gap-3 text-sm">
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
        </Card>
      ))}
    </div>
  );
}
