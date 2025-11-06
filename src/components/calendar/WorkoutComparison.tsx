import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkoutComparison } from "@/hooks/useWorkoutComparison";
import { WorkoutProgressionChart } from "./WorkoutProgressionChart";
import { format } from 'date-fns';
import { Calendar, Dumbbell, Flame, Clock, TrendingUp } from 'lucide-react';
import LoadingSpinner from "@/components/LoadingSpinner";

interface WorkoutComparisonProps {
  muscleGroup?: string;
  exerciseName?: string;
  machineName?: string;
}

export const WorkoutComparison = ({ muscleGroup, exerciseName, machineName }: WorkoutComparisonProps) => {
  const { sessions, progression, loading } = useWorkoutComparison(muscleGroup, exerciseName);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No historical workouts found for comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const totalWorkouts = sessions.length;
  const avgDuration = sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / totalWorkouts;
  const avgCalories = sessions.reduce((sum, s) => sum + s.calories_burned, 0) / totalWorkouts;
  const totalVolume = sessions.reduce((sum, s) => 
    sum + s.exercises.reduce((exSum, ex) => exSum + ex.total_volume, 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-lg font-bold">{totalWorkouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
                <p className="text-lg font-bold">{Math.round(avgDuration)}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Calories</p>
                <p className="text-lg font-bold">{Math.round(avgCalories)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
                <p className="text-lg font-bold">{(totalVolume / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chart">Progression Chart</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="space-y-4">
          {exerciseName && progression.length > 0 ? (
            <WorkoutProgressionChart data={progression} exerciseName={exerciseName} />
          ) : (
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Select a specific exercise to view progression chart
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-3">
          {sessions.map((session, index) => (
            <Card key={session.id} className="bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {format(new Date(session.completed_at), 'MMM d, yyyy • h:mm a')}
                  </CardTitle>
                  {index === 0 && <Badge variant="secondary">Latest</Badge>}
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.duration_minutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {session.calories_burned} cal
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {session.exercises.length} exercises
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="flex items-center justify-between py-2 border-t border-border/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{exercise.exercise_name}</p>
                        <p className="text-xs text-muted-foreground">{exercise.machine_name}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold">{exercise.weight_used} lbs</p>
                        <p className="text-muted-foreground">
                          {exercise.sets_completed} × {exercise.reps_completed} reps
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
