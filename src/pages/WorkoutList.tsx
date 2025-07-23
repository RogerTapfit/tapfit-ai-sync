import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle, Clock, Target, Activity, AlertTriangle } from "lucide-react";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";

interface WorkoutMachine {
  id: string;
  name: string;
  muscleGroup: string;
  completed: boolean;
}

const WorkoutList = () => {
  const navigate = useNavigate();
  const { startWorkout, logExercise, completeWorkout, getTodaysCompletedExercises, todaysProgress, currentWorkoutLog } = useWorkoutLogger();
  
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

  // Load completed exercises from database
  useEffect(() => {
    const loadCompletedExercises = async () => {
      const completedExercises = await getTodaysCompletedExercises();
      setTodaysWorkouts(workouts => 
        workouts.map(workout => ({
          ...workout,
          completed: completedExercises.includes(workout.name)
        }))
      );
    };

    loadCompletedExercises();
  }, []);

  // Start workout session if not already started
  useEffect(() => {
    const initializeWorkout = async () => {
      if (!currentWorkoutLog) {
        await startWorkout("Daily Chest Workout", "Chest", todaysWorkouts.length);
      }
    };

    initializeWorkout();
  }, []);

  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };

  const toggleWorkoutComplete = async (workoutId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the status icon
    
    const workout = todaysWorkouts.find(w => w.id === workoutId);
    if (!workout || !currentWorkoutLog) return;

    if (!workout.completed) {
      // Log the exercise completion
      const success = await logExercise(
        currentWorkoutLog.id,
        workout.name,
        workout.name, // Use machine name as exercise name
        3, // Default 3 sets
        30, // Default 30 reps
        undefined // No weight specified
      );

      if (success) {
        setTodaysWorkouts(workouts => 
          workouts.map(w => 
            w.id === workoutId ? { ...w, completed: true } : w
          )
        );
      }
    } else {
      // If trying to uncomplete, just update UI (could implement removal logic if needed)
      setTodaysWorkouts(workouts => 
        workouts.map(w => 
          w.id === workoutId ? { ...w, completed: false } : w
        )
      );
    }
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

  const handleFinishEarly = async () => {
    // Calculate completed exercises for early finish
    const completedExercises = todaysWorkouts.filter(w => w.completed);
    const estimatedDuration = Math.max(completedExercises.length * 5, 10); // At least 10 minutes
    
    if (currentWorkoutLog) {
      await completeWorkout(
        currentWorkoutLog.id, 
        estimatedDuration,
        `Finished early - completed ${completedExercises.length} out of ${todaysWorkouts.length} exercises`
      );
    }
    
    navigate('/workout-summary', {
      state: {
        workoutData: {
          name: "Early Workout Session",
          exercises: completedExercises.length,
          duration: estimatedDuration,
          sets: completedExercises.length * 3, // Estimated sets for completed exercises
          totalReps: completedExercises.length * 30, // Estimated total reps for completed exercises
          notes: `Finished early - completed ${completedExercises.length} out of ${todaysWorkouts.length} exercises`
        }
      }
    });
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
            onClick={() => handleWorkoutClick(workout.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div onClick={(e) => toggleWorkoutComplete(workout.id, e)} className="cursor-pointer">
                  {getStatusIcon(workout.completed)}
                </div>
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
        {progressPercentage === 100 ? (
          <Button 
            className="h-12"
            onClick={async () => {
              if (currentWorkoutLog) {
                await completeWorkout(
                  currentWorkoutLog.id,
                  45, // Estimated duration
                  "Completed full workout session"
                );
              }
              navigate('/workout-summary', {
                state: {
                  workoutData: {
                    name: "Daily Workout Session",
                    exercises: todaysWorkouts.length,
                    duration: 45, // Estimated duration
                    sets: todaysWorkouts.length * 4, // Estimated sets
                    totalReps: todaysWorkouts.length * 40, // Estimated total reps
                    notes: ""
                  }
                }
              })
            }}
          >
            Finish Workout Session 🎉
          </Button>
        ) : (
          <Button 
            className="h-12"
            disabled
          >
            {`${completedCount}/${todaysWorkouts.length} Complete`}
          </Button>
        )}
      </div>

      {/* Finish Early Button - Only show if workout is not 100% complete and some exercises are done */}
      {progressPercentage < 100 && completedCount > 0 && (
        <div className="mt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Finish Early
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You've completed {completedCount} out of {todaysWorkouts.length} exercises. 
                  Finishing early will end your workout session and take you to the summary page.
                  You'll still earn Tap Coins for the exercises you've completed!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Workout</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleFinishEarly}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  Yes, Finish Early
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default WorkoutList;