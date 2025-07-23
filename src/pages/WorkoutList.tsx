import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Clock, Target, Activity } from "lucide-react";
import { useWorkoutPlan } from "@/hooks/useWorkoutPlan";

const WorkoutList = () => {
  const navigate = useNavigate();
  const { weeklySchedule, currentPlan, loading } = useWorkoutPlan();
  const [todaysWorkouts, setTodaysWorkouts] = useState<any[]>([]);

  useEffect(() => {
    if (weeklySchedule.length > 0) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const filtered = weeklySchedule.filter(workout => workout.day === today);
      setTodaysWorkouts(filtered);
    }
  }, [weeklySchedule]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const completedCount = todaysWorkouts.filter(w => w.status === 'completed').length;
  const progressPercentage = todaysWorkouts.length > 0 ? (completedCount / todaysWorkouts.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p>Loading today's workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Today's Workout</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="glow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Workout Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {todaysWorkouts.length} exercises completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </Card>

      {/* Plan Info */}
      {currentPlan && (
        <Card className="glow-card p-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">{currentPlan.name}</p>
              <p className="text-sm text-muted-foreground">Goal: {currentPlan.fitness_goal.replace('_', ' ')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Workout List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today's Exercises</h3>
        
        {todaysWorkouts.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Workouts Scheduled</h3>
            <p className="text-muted-foreground mb-4">
              It looks like you don't have any workouts scheduled for today.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          todaysWorkouts.map((workout, index) => (
            <Card 
              key={workout.id || index} 
              className="glow-card p-4 cursor-pointer hover:bg-background/70 transition-all"
              onClick={() => navigate(`/workout/${workout.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(workout.status)}
                  <div>
                    <h4 className="font-semibold">{workout.muscle_group}</h4>
                    <p className="text-sm text-muted-foreground">
                      {workout.exercises.length} exercises • {workout.duration} min
                    </p>
                    <div className="flex gap-2 mt-2">
                      {workout.exercises.slice(0, 3).map((exercise: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {exercise.machine}
                        </Badge>
                      ))}
                      {workout.exercises.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{workout.exercises.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(workout.status)}
                  <p className="text-sm text-muted-foreground mt-1">
                    {workout.time}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {todaysWorkouts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
          <Button 
            className="h-12"
            disabled={progressPercentage === 100}
            onClick={() => {
              const nextWorkout = todaysWorkouts.find(w => w.status !== 'completed');
              if (nextWorkout) {
                navigate(`/workout/${nextWorkout.id}`);
              }
            }}
          >
            {progressPercentage === 100 ? 'All Done! 🎉' : 'Continue Workout'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkoutList;