import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  Square, 
  Plus,
  Bluetooth,
  Smartphone,
  Timer,
  Flame,
  Dumbbell,
  RotateCcw
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restTime: number;
  completed: boolean;
  muscleGroup: string;
}

const WorkoutTracker = () => {
  const [workoutActive, setWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [connectedMachine, setConnectedMachine] = useState<string | null>(null);

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: "1",
      name: "Bench Press",
      sets: 4,
      reps: 8,
      weight: 185,
      restTime: 120,
      completed: false,
      muscleGroup: "Chest"
    },
    {
      id: "2", 
      name: "Incline Dumbbell Press",
      sets: 3,
      reps: 10,
      weight: 70,
      restTime: 90,
      completed: false,
      muscleGroup: "Chest"
    },
    {
      id: "3",
      name: "Cable Flyes", 
      sets: 3,
      reps: 12,
      weight: 40,
      restTime: 60,
      completed: false,
      muscleGroup: "Chest"
    }
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutActive && !isPaused) {
      interval = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutActive, isPaused]);

  useEffect(() => {
    // Simulate machine connection
    const timer = setTimeout(() => {
      setConnectedMachine("Smart Bench Press Pro");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    setWorkoutActive(true);
    setIsPaused(false);
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
  };

  const endWorkout = () => {
    setWorkoutActive(false);
    setIsPaused(false);
    setWorkoutTime(0);
  };

  const completeExercise = (id: string) => {
    setExercises(prev => 
      prev.map(ex => ex.id === id ? { ...ex, completed: true } : ex)
    );
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const progressPercentage = (completedCount / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chest & Triceps</h1>
          <p className="text-muted-foreground">Upper Body Strength</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Active Workout
        </Badge>
      </div>

      {/* Workout Timer & Stats */}
      <Card className="glow-card pulse-glow">
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Timer className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatTime(workoutTime)}</p>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
            <div>
              <Flame className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.floor(workoutTime * 4.2)}</p>
              <p className="text-sm text-muted-foreground">Calories</p>
            </div>
            <div>
              <Dumbbell className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedCount}/{exercises.length}</p>
              <p className="text-sm text-muted-foreground">Exercises</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Workout Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </div>
      </Card>

      {/* Connected Device */}
      {connectedMachine && (
        <Card className="glow-card animate-fade-in">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Bluetooth className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{connectedMachine}</p>
                <p className="text-sm text-muted-foreground">Auto-tracking enabled</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </Card>
      )}

      {/* Exercise List */}
      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <Card 
            key={exercise.id} 
            className={`glow-card transition-all ${
              exercise.completed ? 'opacity-60' : ''
            } ${
              index === currentExercise && workoutActive ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{exercise.name}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {exercise.muscleGroup}
                  </Badge>
                </div>
                {exercise.completed && (
                  <Badge className="bg-green-500 text-white">Complete</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                <div>
                  <span className="font-medium text-foreground">{exercise.sets}</span> sets
                </div>
                <div>
                  <span className="font-medium text-foreground">{exercise.reps}</span> reps
                </div>
                <div>
                  <span className="font-medium text-foreground">{exercise.weight}</span> lbs
                </div>
              </div>

              {!exercise.completed && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => completeExercise(exercise.id)}
                    className="glow-button flex-1"
                    size="sm"
                  >
                    Complete Set
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Workout Controls */}
      <Card className="glow-card sticky bottom-4">
        <div className="p-4">
          <div className="flex gap-3">
            {!workoutActive ? (
              <Button onClick={startWorkout} className="glow-button flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Workout
              </Button>
            ) : (
              <>
                <Button 
                  onClick={pauseWorkout} 
                  variant="outline" 
                  className="flex-1"
                >
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button 
                  onClick={endWorkout} 
                  variant="destructive" 
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Workout
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* AI Real-time Feedback */}
      {workoutActive && (
        <Card className="ai-feedback animate-slide-up fixed top-4 right-4 w-80 z-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-semibold">AI Coach</span>
            </div>
            <p className="text-sm">
              Great form on that last set! Consider increasing weight by 5lbs next session.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkoutTracker;