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
import { supabase } from "@/integrations/supabase/client";
import { MachineRegistryService } from "@/services/machineRegistryService";

interface WorkoutMachine {
  id: string;
  name: string;
  muscleGroup: string;
  completed: boolean;
  workoutDetails?: {
    sets: number;
    reps: number;
    weight?: number;
    completedAt?: string;
    totalWeightLifted?: number;
  };
}

const WorkoutList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startWorkout, logExercise, completeWorkout, getTodaysCompletedExercises, todaysProgress, currentWorkoutLog, refreshProgress } = useWorkoutLogger();
  
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutMachine[]>([]);
  const [completedExtraExercises, setCompletedExtraExercises] = useState<WorkoutMachine[]>([]);
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState<string>('chest');

  // Initialize dynamic workout plan based on scheduled workouts or muscle group
  const initializeWorkoutPlan = useCallback(async () => {
    console.log("Initializing dynamic workout plan...");
    
    // Check for scheduled workout first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to get scheduled workout for today
    const today = new Date().toISOString().split('T')[0];
    const { data: scheduledWorkouts } = await supabase
      .from('scheduled_workouts')
      .select(`
        *,
        workout_exercises (
          machine_name,
          sets,
          reps,
          weight,
          exercise_order
        )
      `)
      .eq('user_id', user.id)
      .eq('scheduled_date', today);

    let muscleGroup = currentMuscleGroup;
    let workoutPlan: WorkoutMachine[] = [];

    if (scheduledWorkouts && scheduledWorkouts.length > 0) {
      // Use scheduled workout
      console.log("Found scheduled workout:", scheduledWorkouts[0]);
      muscleGroup = scheduledWorkouts[0].target_muscle_group;
      setCurrentMuscleGroup(muscleGroup);
      
      workoutPlan = scheduledWorkouts[0].workout_exercises
        ?.sort((a: any, b: any) => a.exercise_order - b.exercise_order)
        .map((exercise: any, index: number) => ({
          id: (index + 1).toString(),
          name: exercise.machine_name,
          muscleGroup: muscleGroup,
          completed: false
        })) || [];
    } else {
      // Fallback: check location state for scanned machine muscle group
      if (location.state?.scannedMachine) {
        const scannedMachine = MachineRegistryService.getMachineByName(location.state.scannedMachine);
        if (scannedMachine) {
          muscleGroup = scannedMachine.muscleGroup;
          setCurrentMuscleGroup(muscleGroup);
          console.log("Using muscle group from scanned machine:", muscleGroup);
        }
      }

      // Generate plan from MachineRegistryService for the muscle group
      const machinesForMuscleGroup = MachineRegistryService.getAllMachines()
        .filter(machine => machine.muscleGroup === muscleGroup)
        .slice(0, 8); // Limit to 8 exercises

      workoutPlan = machinesForMuscleGroup.map((machine, index) => ({
        id: (index + 1).toString(),
        name: machine.name,
        muscleGroup: machine.muscleGroup,
        completed: false
      }));
    }

    console.log("Generated workout plan:", workoutPlan);
    setTodaysWorkouts(workoutPlan);
  }, [currentMuscleGroup, location.state]);

  // Load completed exercises and merge with plan
  const loadCompletedExercises = useCallback(async () => {
    console.log("Loading completed exercises...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: exerciseLogs, error } = await supabase
      .from('exercise_logs')
      .select('exercise_name, sets_completed, reps_completed, weight_used, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', new Date().toISOString().split('T')[0])
      .lt('completed_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching exercise logs:', error);
      return;
    }

    console.log("Exercise logs from DB:", exerciseLogs);
    console.log("Current workout plan:", todaysWorkouts);
    console.log("Muscle group:", currentMuscleGroup);
    
    // Helper function to find matching machine
    const findMatchingMachine = (exerciseName: string) => {
      // Try direct name match first
      let machine = MachineRegistryService.getMachineByName(exerciseName);
      if (machine) return machine;

      // Try variations
      const variations = [
        exerciseName.replace(' Machine', ''),
        exerciseName.replace('Machine', ''),
        exerciseName + ' Machine'
      ];
      
      for (const variation of variations) {
        machine = MachineRegistryService.getMachineByName(variation);
        if (machine) return machine;
      }
      
      return null;
    };

    // Update existing plan workouts with completion status
    setTodaysWorkouts(workouts => {
      return workouts.map(workout => {
        const exerciseLog = exerciseLogs?.find(log => {
          // Try exact match first
          if (log.exercise_name === workout.name) return true;
          
          // Try normalized matching
          const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedWorkout = normalizeString(workout.name);
          const normalizedLog = normalizeString(log.exercise_name);
          
          return normalizedLog === normalizedWorkout ||
                 normalizedLog.includes(normalizedWorkout) ||
                 normalizedWorkout.includes(normalizedLog);
        });
        
        return {
          ...workout,
          completed: !!exerciseLog,
          workoutDetails: exerciseLog ? {
            sets: exerciseLog.sets_completed,
            reps: exerciseLog.reps_completed,
            weight: exerciseLog.weight_used,
            completedAt: exerciseLog.completed_at,
            totalWeightLifted: exerciseLog.weight_used ? exerciseLog.weight_used * exerciseLog.reps_completed : undefined
          } : undefined
        };
      });
    });

    // Find completed exercises not in the plan
    const extraExercises: WorkoutMachine[] = [];
    const plannedExerciseNames = todaysWorkouts.map(w => w.name.toLowerCase());
    
    exerciseLogs?.forEach((log, index) => {
      const machine = findMatchingMachine(log.exercise_name);
      const isInPlan = plannedExerciseNames.some(name => {
        const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizeString(name) === normalizeString(log.exercise_name) ||
               name.includes(log.exercise_name.toLowerCase()) ||
               log.exercise_name.toLowerCase().includes(name);
      });

      if (!isInPlan) {
        extraExercises.push({
          id: `extra-${index}`,
          name: log.exercise_name,
          muscleGroup: machine?.muscleGroup || 'other',
          completed: true,
          workoutDetails: {
            sets: log.sets_completed,
            reps: log.reps_completed,
            weight: log.weight_used,
            completedAt: log.completed_at,
            totalWeightLifted: log.weight_used ? log.weight_used * log.reps_completed : undefined
          }
        });
      }
    });

    console.log("Extra completed exercises:", extraExercises);
    setCompletedExtraExercises(extraExercises);
  }, [todaysWorkouts]);

  // Initial load with loading protection
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (mounted) {
        await initializeWorkoutPlan();
        await refreshProgress();
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, [initializeWorkoutPlan, refreshProgress]);

  // Load completed exercises after plan is initialized
  useEffect(() => {
    if (todaysWorkouts.length > 0) {
      loadCompletedExercises();
    }
  }, [todaysWorkouts.length, loadCompletedExercises]);

  // Refresh when returning from workout detail
  useEffect(() => {
    if (location.state?.fromWorkoutDetail) {
      console.log('Returned from workout detail, refreshing data...');
      loadCompletedExercises();
      refreshProgress();
      // Clear the flag
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, loadCompletedExercises, refreshProgress, navigate]);

  // Set up realtime subscription for exercise logs
  useEffect(() => {
    let channel: any = null;
    
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Setting up realtime subscription for exercise_logs');
      channel = supabase
        .channel('exercise_logs_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'exercise_logs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New exercise log detected via realtime:', payload);
            loadCompletedExercises();
            refreshProgress();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      console.log('Cleaning up realtime subscription');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadCompletedExercises, refreshProgress]);

  // Start workout session once when component mounts (not on every change)
  useEffect(() => {
    let mounted = true;
    
    const initializeWorkout = async () => {
      console.log("Initializing workout, currentWorkoutLog:", currentWorkoutLog);
      if (mounted && !currentWorkoutLog) {
        console.log("No current workout log, starting new workout");
        await startWorkout(`Daily ${currentMuscleGroup.charAt(0).toUpperCase() + currentMuscleGroup.slice(1)} Workout`, currentMuscleGroup, todaysWorkouts.length);
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
  const totalExercises = todaysWorkouts.length + completedExtraExercises.length;
  const totalCompleted = completedCount + completedExtraExercises.length;
  const progressPercentage = totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0;
  
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
              {totalCompleted} of {totalExercises} exercises completed
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
          <Dumbbell className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold text-primary">{currentMuscleGroup.charAt(0).toUpperCase() + currentMuscleGroup.slice(1)} Day Workout</p>
            <p className="text-sm text-foreground/70">Goal: {currentMuscleGroup.charAt(0).toUpperCase() + currentMuscleGroup.slice(1)} Development</p>
          </div>
        </div>
      </Card>

      {/* Workout List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Today's {currentMuscleGroup.charAt(0).toUpperCase() + currentMuscleGroup.slice(1)} Exercises
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
                  <div className="space-y-1">
                    <p className="text-sm text-foreground/70 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-secondary" />
                      Target: {workout.muscleGroup}
                    </p>
                    {workout.completed && workout.workoutDetails && (
                      <div className="text-xs text-green-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <span>{workout.workoutDetails.sets} sets × {workout.workoutDetails.reps} reps</span>
                          {workout.workoutDetails.weight && (
                            <span>@ {workout.workoutDetails.weight} lbs</span>
                          )}
                        </p>
                        {workout.workoutDetails.totalWeightLifted && (
                          <p className="font-medium">
                            Total Weight: {workout.workoutDetails.totalWeightLifted} lbs
                          </p>
                        )}
                        <p className="text-foreground/50">
                          Completed: {new Date(workout.workoutDetails.completedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
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

      {/* Completed Extra Exercises (Not in Plan) */}
      {completedExtraExercises.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Completed Today (Not in Plan)
          </h3>
          
          {completedExtraExercises.map((workout, index) => (
            <Card 
              key={workout.id} 
              className="glow-card p-4 border-l-2 border-l-green-500/60 bg-gradient-to-r from-green-500/5 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{workout.name}</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground/70 flex items-center gap-1">
                        <Activity className="h-3 w-3 text-secondary" />
                        Target: {workout.muscleGroup}
                      </p>
                      {workout.workoutDetails && (
                        <div className="text-xs text-green-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <span>{workout.workoutDetails.sets} sets × {workout.workoutDetails.reps} reps</span>
                            {workout.workoutDetails.weight && (
                              <span>@ {workout.workoutDetails.weight} lbs</span>
                            )}
                          </p>
                          {workout.workoutDetails.totalWeightLifted && (
                            <p className="font-medium">
                              Total Weight: {workout.workoutDetails.totalWeightLifted} lbs
                            </p>
                          )}
                          <p className="text-foreground/50">
                            Completed: {new Date(workout.workoutDetails.completedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Completed</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
            {`${completedCount}/${totalExercises} Complete`}
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
                  You've completed {totalCompleted} out of {totalExercises} exercises. 
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
