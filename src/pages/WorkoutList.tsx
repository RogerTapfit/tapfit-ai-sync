import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle, Clock, Dumbbell, Activity, AlertTriangle, Smartphone, Camera } from "lucide-react";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { NFCMachinePopup } from "@/components/NFCMachinePopup";

interface WorkoutMachine {
  id: string;
  name: string;
  muscleGroup: string;
  completed: boolean;
}

const WorkoutList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startWorkout, logExercise, completeWorkout, getTodaysCompletedExercises, todaysProgress, currentWorkoutLog, refreshProgress } = useWorkoutLogger();
  
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

  // Load completed exercises from database (memoized to prevent infinite loops)
  const loadCompletedExercises = useCallback(async () => {
    console.log("Loading completed exercises...");
    const completedExercises = await getTodaysCompletedExercises();
    console.log("Completed exercises from DB:", completedExercises);
    
    setTodaysWorkouts(workouts => {
      const updatedWorkouts = workouts.map(workout => ({
        ...workout,
        completed: completedExercises.includes(workout.name)
      }));
      console.log("Updated workouts:", updatedWorkouts);
      return updatedWorkouts;
    });
  }, [getTodaysCompletedExercises]);

  // Initial load with loading protection
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (mounted) {
        await loadCompletedExercises();
        await refreshProgress();
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, [loadCompletedExercises, refreshProgress]);

  // Start workout session once when component mounts (not on every change)
  useEffect(() => {
    let mounted = true;
    
    const initializeWorkout = async () => {
      console.log("Initializing workout, currentWorkoutLog:", currentWorkoutLog);
      if (mounted && !currentWorkoutLog) {
        console.log("No current workout log, starting new workout");
        await startWorkout("Daily Chest Workout", "Chest", todaysWorkouts.length);
      }
    };

    // Only initialize if we don't have a workout log
    if (!currentWorkoutLog) {
      initializeWorkout();
    }
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - run only once

  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };

  const toggleWorkoutComplete = async (workoutId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the status icon
    
    const workout = todaysWorkouts.find(w => w.id === workoutId);
    if (!workout || !currentWorkoutLog) {
      console.error("No workout or currentWorkoutLog found:", { workout, currentWorkoutLog });
      return;
    }

    if (!workout.completed) {
      console.log("Marking workout as complete:", workout.name);
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
        console.log("Exercise logged successfully, updating local state");
        
        // Play enhanced success sound
        const { audioManager } = await import('@/utils/audioUtils');
        await audioManager.playSetComplete();
        
        // Check for progress milestones
        const newCompletedCount = todaysWorkouts.filter(w => w.completed || w.id === workoutId).length;
        const newProgress = (newCompletedCount / todaysWorkouts.length) * 100;
        
        if (newProgress === 25 || newProgress === 50 || newProgress === 75) {
          setTimeout(async () => {
            await audioManager.playProgressMilestone(newProgress);
          }, 300);
        } else if (newProgress === 100) {
          setTimeout(async () => {
            await audioManager.playWorkoutComplete();
          }, 500);
        }
        
        setTodaysWorkouts(workouts => 
          workouts.map(w => 
            w.id === workoutId ? { ...w, completed: true } : w
          )
        );
        // Don't call loadCompletedExercises here to prevent loops
      }
    } else {
      console.log("Trying to uncomplete workout - not implemented");
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
      : <Clock className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (completed: boolean) => {
    return completed 
      ? <Badge variant="default" className="bg-green-500">Completed</Badge>
      : <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-transparent hover:shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-shadow duration-300">Pending</Badge>;
  };

  const handleScanMachine = async () => {
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playButtonClick();
    navigate('/scan-machine');
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
  
  // Dynamic progress bar gradient color based on percentage
  const getProgressGradient = (percentage: number) => {
    // Create a smooth gradient from red (0%) to yellow (50%) to green (100%)
    if (percentage <= 50) {
      // Red to Yellow transition (0% to 50%)
      const ratio = percentage / 50;
      const red = 255;
      const green = Math.round(255 * ratio);
      const blue = 0;
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Yellow to Green transition (50% to 100%)
      const ratio = (percentage - 50) / 50;
      const red = Math.round(255 * (1 - ratio));
      const green = 255;
      const blue = 0;
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={async () => {
            const { audioManager } = await import('@/utils/audioUtils');
            await audioManager.playButtonClick();
            navigate(-1);
          }}
          className="border-primary/30 hover:border-primary/60 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Today's Workout
          </h1>
          <p className="text-foreground/70">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Scan Machine Button */}
      <div className="space-y-4">
        <Button 
          onClick={handleScanMachine}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
          size="lg"
        >
          <Camera className="h-5 w-5 mr-2" />
          Scan Machine
        </Button>
      </div>
      <Card className="glow-card p-6 border-l-4 border-l-primary/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">Workout Progress</h3>
            <p className="text-sm text-foreground/70">
              {completedCount} of {todaysWorkouts.length} exercises completed
            </p>
          </div>
          <div className="text-right">
            <div 
              className="text-2xl font-bold transition-colors duration-500"
              style={{
                color: getProgressGradient(progressPercentage)
              }}
            >
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-foreground/70">Complete</div>
          </div>
        </div>
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
          <div 
            className="absolute inset-0 h-3 rounded-full transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, 
                rgb(239, 68, 68) 0%, 
                rgb(251, 191, 36) 50%, 
                rgb(34, 197, 94) 100%)`,
              width: `${progressPercentage}%`,
              clipPath: 'inset(0 0 0 0)'
            }}
          />
        </div>
      </Card>

      {/* Plan Info */}
      <Card className="glow-card p-4 border-l-4 border-l-accent/50 bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-semibold text-red-500">Chest Day Workout</p>
            <p className="text-sm text-foreground/70">Goal: Chest Development</p>
          </div>
        </div>
      </Card>

      {/* Workout List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Today's Chest Exercises
        </h3>
        
        {todaysWorkouts.map((workout, index) => (
          <Card 
            key={workout.id} 
            className={`glow-card p-4 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 border-l-2 ${
              workout.completed 
                ? 'border-l-green-500/60 bg-gradient-to-r from-green-500/5 to-transparent' 
                : 'border-l-secondary/40 hover:border-l-primary/60'
            }`}
            onClick={() => handleWorkoutClick(workout.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div onClick={(e) => toggleWorkoutComplete(workout.id, e)} className="cursor-pointer">
                  {getStatusIcon(workout.completed)}
                </div>
                <div>
                  <h4 className="font-semibold">{workout.name}</h4>
                  <p className="text-sm text-foreground/70 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-secondary" />
                    Target: {workout.muscleGroup}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(workout.completed)}
                <NFCMachinePopup machineId={workout.name.toLowerCase().replace(/\s+/g, '-')} machineName={workout.name}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-12 text-xs bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                </NFCMachinePopup>
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
          onClick={async () => {
            const { audioManager } = await import('@/utils/audioUtils');
            await audioManager.playButtonClick();
            navigate('/');
          }}
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
