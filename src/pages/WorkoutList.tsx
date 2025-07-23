import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Clock, Target, Activity } from "lucide-react";

interface WorkoutMachine {
  id: string;
  name: string;
  muscleGroup: string;
  completed: boolean;
}

const WorkoutList = () => {
  const navigate = useNavigate();
  
  // Today's chest workout machines
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutMachine[]>([
    { id: "1", name: "Chest Press Machine", muscleGroup: "Chest", completed: false },
    { id: "2", name: "Pec Deck (Butterfly) Machine", muscleGroup: "Chest", completed: false },
    { id: "3", name: "Incline Chest Press Machine", muscleGroup: "Chest", completed: false },
    { id: "4", name: "Decline Chest Press Machine", muscleGroup: "Chest", completed: false },
    { id: "5", name: "Cable Crossover Machine", muscleGroup: "Chest", completed: false },
    { id: "6", name: "Smith Machine (Flat Bench Press setup)", muscleGroup: "Chest", completed: false },
    { id: "7", name: "Seated Dip Machine (Chest-focused variant)", muscleGroup: "Chest", completed: false },
    { id: "8", name: "Assisted Chest Dips Machine", muscleGroup: "Chest", completed: false }
  ]);

  const toggleWorkoutComplete = (workoutId: string) => {
    setTodaysWorkouts(workouts => 
      workouts.map(w => 
        w.id === workoutId ? { ...w, completed: !w.completed } : w
      )
    );
  };

  const getStatusIcon = (completed: boolean) => {
    return completed 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (completed: boolean) => {
    return completed 
      ? <Badge variant="default" className="bg-green-500">Completed</Badge>
      : <Badge variant="secondary">Pending</Badge>;
  };

  const completedCount = todaysWorkouts.filter(w => w.completed).length;
  const progressPercentage = todaysWorkouts.length > 0 ? (completedCount / todaysWorkouts.length) * 100 : 0;

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
      <Card className="glow-card p-4">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold">Chest Day Workout</p>
            <p className="text-sm text-muted-foreground">Goal: Chest Development</p>
          </div>
        </div>
      </Card>

      {/* Workout List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today's Chest Exercises</h3>
        
        {todaysWorkouts.map((workout) => (
          <Card 
            key={workout.id} 
            className="glow-card p-4 cursor-pointer hover:bg-background/70 transition-all"
            onClick={() => toggleWorkoutComplete(workout.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(workout.completed)}
                <div>
                  <h4 className="font-semibold">{workout.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Target: {workout.muscleGroup}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(workout.completed)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
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
        >
          {progressPercentage === 100 ? 'All Done! 🎉' : `${completedCount}/${todaysWorkouts.length} Complete`}
        </Button>
      </div>
    </div>
  );
};

export default WorkoutList;