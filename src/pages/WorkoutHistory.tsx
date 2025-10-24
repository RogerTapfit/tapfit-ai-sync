import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Footprints, Bike, Waves, Clock, Flame, Dumbbell, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthGuard";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkoutHistoryItem {
  id: string;
  type: 'strength' | 'run' | 'ride' | 'swim';
  date: Date;
  duration: number;
  caloriesBurned: number;
  details: any;
}

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllWorkouts = async () => {
      if (!user?.id) return;

      try {
        const [strengthData, runsData, ridesData, swimsData] = await Promise.all([
          supabase.from('exercise_logs').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20),
          supabase.from('runs').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20),
          supabase.from('rides').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20),
          supabase.from('swims').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20),
        ]);

        const allWorkouts: WorkoutHistoryItem[] = [
          ...(strengthData.data || []).map(w => ({
            id: w.id,
            type: 'strength' as const,
            date: new Date(w.completed_at),
            duration: w.duration_min || 0,
            caloriesBurned: w.calories_burned || 0,
            details: w
          })),
          ...(runsData.data || []).map(r => ({
            id: r.id,
            type: 'run' as const,
            date: new Date(r.completed_at),
            duration: r.duration_seconds ? Math.round(r.duration_seconds / 60) : 0,
            caloriesBurned: r.calories_burned || 0,
            details: r
          })),
          ...(ridesData.data || []).map(r => ({
            id: r.id,
            type: 'ride' as const,
            date: new Date(r.completed_at),
            duration: r.duration_seconds ? Math.round(r.duration_seconds / 60) : 0,
            caloriesBurned: r.calories_burned || 0,
            details: r
          })),
          ...(swimsData.data || []).map(s => ({
            id: s.id,
            type: 'swim' as const,
            date: new Date(s.completed_at),
            duration: s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0,
            caloriesBurned: s.calories_burned || 0,
            details: s
          })),
        ];

        allWorkouts.sort((a, b) => b.date.getTime() - a.date.getTime());
        setWorkouts(allWorkouts);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWorkouts();
  }, [user?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'run': return <Footprints className="h-5 w-5" />;
      case 'ride': return <Bike className="h-5 w-5" />;
      case 'swim': return <Waves className="h-5 w-5" />;
      default: return <Dumbbell className="h-5 w-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'run': return 'bg-orange-500';
      case 'ride': return 'bg-green-500';
      case 'swim': return 'bg-cyan-500';
      default: return 'bg-stats-heart';
    }
  };

  const handleWorkoutClick = (workout: WorkoutHistoryItem) => {
    switch (workout.type) {
      case 'run':
        navigate(`/run/summary/${workout.id}`);
        break;
      case 'ride':
        navigate(`/ride/summary/${workout.id}`);
        break;
      case 'swim':
        navigate(`/swim/summary/${workout.id}`);
        break;
      case 'strength':
        navigate(`/workout/${workout.id}`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Workout History</h1>
            <p className="text-muted-foreground">All your fitness activities</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
            <p className="text-muted-foreground mb-4">Start your first workout to see it here</p>
            <Button onClick={() => navigate('/workout-list')}>Start Workout</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card 
                key={workout.id} 
                className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleWorkoutClick(workout)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${getColor(workout.type)}/20`}>
                      {getIcon(workout.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{workout.type} Workout</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(workout.date, 'EEEE, MMMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">View Details</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{workout.duration} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Calories</p>
                      <p className="font-semibold">{workout.caloriesBurned}</p>
                    </div>
                  </div>
                  {workout.type === 'swim' && workout.details.distance_meters && (
                    <div className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-cyan-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Distance</p>
                        <p className="font-semibold">{workout.details.distance_meters}m</p>
                      </div>
                    </div>
                  )}
                  {workout.type === 'strength' && workout.details.exercises_completed && (
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-stats-heart" />
                      <div>
                        <p className="text-sm text-muted-foreground">Exercises</p>
                        <p className="font-semibold">{workout.details.exercises_completed}</p>
                      </div>
                    </div>
                  )}
                  {(workout.type === 'run' || workout.type === 'ride') && workout.details.avg_heart_rate && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-stats-heart" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avg HR</p>
                        <p className="font-semibold">{workout.details.avg_heart_rate} bpm</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistory;
