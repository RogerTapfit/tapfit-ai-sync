import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Clock, Dumbbell, Activity, AlertTriangle, Smartphone, Camera, MessageCircle, Phone, ChevronDown, Calendar } from "lucide-react";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { useMuscleGroupAnalysis } from "@/hooks/useMuscleGroupAnalysis";
import { NFCMachinePopup } from "@/components/NFCMachinePopup";
import FitnessChatbot from "@/components/FitnessChatbot";
import VoiceInterface from "@/components/VoiceInterface";
import { DailyWorkoutSection } from "@/components/DailyWorkoutSection";
import { supabase } from "@/integrations/supabase/client";
import { MachineRegistryService } from "@/services/machineRegistryService";
import { toast } from "sonner";

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
  const { startWorkout, logExercise, completeWorkout, getTodaysCompletedExercises, calculateActualWorkoutTotals, todaysProgress, currentWorkoutLog, refreshProgress } = useWorkoutLogger();
  
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutMachine[]>([]);
  const [completedExtraExercises, setCompletedExtraExercises] = useState<WorkoutMachine[]>([]);
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState<string>('chest');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // Helper function to determine if a workout is cardio
  const isCardio = (workout: WorkoutMachine) => {
    const cardioKeywords = ['treadmill', 'elliptical', 'bike', 'cycling', 'cardio', 'running', 'walking'];
    const workoutName = workout.name.toLowerCase();
    return workout.muscleGroup === 'cardio' || cardioKeywords.some(keyword => workoutName.includes(keyword));
  };


  // Real-time muscle group analysis based on all exercises
  const muscleGroupAnalysis = useMuscleGroupAnalysis(todaysWorkouts, completedExtraExercises);

  // Initialize dynamic workout plan - run once on mount only
  const initializeWorkoutPlan = useCallback(async () => {
    console.log("🔄 Initializing dynamic workout plan...");
    
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

    let workoutPlan: WorkoutMachine[] = [];

    if (scheduledWorkouts && scheduledWorkouts.length > 0) {
      // Use scheduled workout
      console.log("📅 Found scheduled workout:", scheduledWorkouts[0]);
      const muscleGroup = scheduledWorkouts[0].target_muscle_group;
      console.log("🎯 Scheduled target muscle group:", muscleGroup);
      
      workoutPlan = scheduledWorkouts[0].workout_exercises
        ?.sort((a: any, b: any) => a.exercise_order - b.exercise_order)
        .map((exercise: any, index: number) => {
          // Look up the actual machine to get its real muscle group
          const machine = MachineRegistryService.getMachineByName(exercise.machine_name);
          const actualMuscleGroup = machine?.muscleGroup || 'unknown';
          
          console.log(`🔍 Exercise: ${exercise.machine_name} | Scheduled as: ${muscleGroup} | Actual: ${actualMuscleGroup}`);
          
          return {
            id: (index + 1).toString(),
            name: exercise.machine_name,
            muscleGroup: actualMuscleGroup, // Use actual machine muscle group
            completed: false
          };
        }) || [];
        
      // Update muscle group based on actual exercises
      const muscleGroups = workoutPlan.map(w => w.muscleGroup);
      const muscleGroupCounts = muscleGroups.reduce((acc, mg) => {
        acc[mg] = (acc[mg] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostCommonMuscleGroup = Object.entries(muscleGroupCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || muscleGroup;
      
      console.log("📊 Muscle group distribution:", muscleGroupCounts);
      console.log("🏆 Most common muscle group:", mostCommonMuscleGroup);
      setCurrentMuscleGroup(mostCommonMuscleGroup);
    } else {
      // Fallback: check location state for scanned machine muscle group
      let muscleGroup = currentMuscleGroup;
      if (location.state?.scannedMachine) {
        const scannedMachine = MachineRegistryService.getMachineByName(location.state.scannedMachine);
        if (scannedMachine) {
          muscleGroup = scannedMachine.muscleGroup;
          setCurrentMuscleGroup(muscleGroup);
          console.log("Using muscle group from scanned machine:", muscleGroup);
        }
      }

      // Generate plan from MachineRegistryService for the muscle group
      let machinesForMuscleGroup = MachineRegistryService.getAllMachines()
        .filter(machine => machine.muscleGroup === muscleGroup);

      // Always prioritize Lat Pulldown Machine when viewing Back workouts
      if (muscleGroup === 'back') {
        const latIds = ['MCH-LAT-PULLDOWN'];
        const isLat = (m: any) => latIds.includes(m.id) || m.name.toLowerCase().includes('lat pulldown');
        const latMachine = machinesForMuscleGroup.find(isLat);
        if (latMachine) {
          machinesForMuscleGroup = [latMachine, ...machinesForMuscleGroup.filter(m => m.id !== latMachine.id)];
        }
      }

      machinesForMuscleGroup = machinesForMuscleGroup.slice(0, 8); // Limit to 8 exercises

      workoutPlan = machinesForMuscleGroup.map((machine) => ({
        id: machine.id, // Use machine ID instead of index for consistency
        name: machine.name,
        muscleGroup: machine.muscleGroup,
        completed: false
      }));
    }

    console.log("Generated workout plan:", workoutPlan);
    setTodaysWorkouts(workoutPlan);
  }, [currentMuscleGroup]); // Re-run when muscle group changes

  // Load completed exercises and merge with plan
  const loadCompletedExercises = useCallback(async () => {
    console.log("Loading completed exercises...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use proper local date boundaries - strict midnight cutoff for clean daily separation
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString();
    const tomorrowStr = tomorrow.toISOString();

    console.log(`Filtering exercises for today (strict): ${todayStr} to ${tomorrowStr}`);

    const { data: exerciseLogs, error } = await supabase
      .from('exercise_logs')
      .select('exercise_name, sets_completed, reps_completed, weight_used, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', todayStr)
      .lt('completed_at', tomorrowStr)
      .order('completed_at', { ascending: true });

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

    // Find completed exercises not in the plan and group them properly
    const extraExercises: WorkoutMachine[] = [];
    const plannedExerciseNames = todaysWorkouts.map(w => w.name.toLowerCase());
    
    // Group exercises by unique name to avoid duplicates
    const uniqueExercises = new Map<string, typeof exerciseLogs[0]>();
    
    exerciseLogs?.forEach((log) => {
      const machine = findMatchingMachine(log.exercise_name);
      const isInPlan = plannedExerciseNames.some(name => {
        const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizeString(name) === normalizeString(log.exercise_name) ||
               name.includes(log.exercise_name.toLowerCase()) ||
               log.exercise_name.toLowerCase().includes(name);
      });

      if (!isInPlan) {
        const normalizedName = log.exercise_name.toLowerCase();
        // Keep the most recent entry for each exercise
        if (!uniqueExercises.has(normalizedName) || 
            new Date(log.completed_at) > new Date(uniqueExercises.get(normalizedName)!.completed_at)) {
          uniqueExercises.set(normalizedName, log);
        }
      }
    });

    // Convert unique exercises to workout machines
    let extraIndex = 0;
    uniqueExercises.forEach((log) => {
      const machine = findMatchingMachine(log.exercise_name);
      extraExercises.push({
        id: `extra-${extraIndex++}`,
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
    });

    console.log("Extra completed exercises (deduplicated):", extraExercises);
    setCompletedExtraExercises(extraExercises);
  }, [todaysWorkouts]);

  // Stable refs for realtime handlers to avoid resubscribes
  const loadCompletedExercisesRef = useRef(loadCompletedExercises);
  const refreshProgressRef = useRef(refreshProgress);
  useEffect(() => { loadCompletedExercisesRef.current = loadCompletedExercises; }, [loadCompletedExercises]);
  useEffect(() => { refreshProgressRef.current = refreshProgress; }, [refreshProgress]);

  // Initial load - run once only
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
  }, []); // Empty dependency - run once on mount

  // Re-initialize workout plan when muscle group changes
  useEffect(() => {
    if (todaysWorkouts.length > 0) { // Only reinitialize if we have initial workouts
      initializeWorkoutPlan();
    }
  }, [currentMuscleGroup, initializeWorkoutPlan]);

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

  // Set up realtime subscription for exercise logs (stable, subscribe once)
  useEffect(() => {
    let channel: any = null;
    let mounted = true;
    
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

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
            loadCompletedExercisesRef.current?.();
            refreshProgressRef.current?.();
          }
        )
        .subscribe();
    })();

    return () => {
      console.log('Cleaning up realtime subscription');
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Start workout session once when component mounts (not on every change)
  useEffect(() => {
    let mounted = true;
    
    const initializeWorkout = async () => {
      console.log("Initializing workout, currentWorkoutLog:", currentWorkoutLog);
      if (mounted && !currentWorkoutLog) {
        console.log("No current workout log, starting new workout");
        // Use dynamic muscle group analysis for workout name
        const workoutName = `Daily ${muscleGroupAnalysis.workoutType}`;
        await startWorkout(workoutName, muscleGroupAnalysis.predominantGroup, todaysWorkouts.length);
      }
    };

    // Only initialize if we don't have a workout log and we have workouts loaded
    if (!currentWorkoutLog && todaysWorkouts.length > 0) {
      initializeWorkout();
    }
    
    return () => {
      mounted = false;
    };
  }, [startWorkout, currentWorkoutLog, todaysWorkouts.length, muscleGroupAnalysis.workoutType, muscleGroupAnalysis.predominantGroup]); // Updated dependencies

  const handleWorkoutClick = (workoutId: string) => {
    const machine = todaysWorkouts.find(w => w.id === workoutId);
    if (machine) {
      // Pass machine data via navigation state
      navigate(`/workout/${workoutId}`, {
        state: {
          machineData: {
            name: machine.name,
            muscleGroup: machine.muscleGroup,
            id: machine.id
          }
        }
      });
    } else {
      navigate(`/workout/${workoutId}`);
    }
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
      
      // Use cardio-aware defaults
      const cardioWorkout = isCardio(workout);
      const defaultSets = cardioWorkout ? 1 : 3;
      const defaultReps = cardioWorkout ? 20 : 30; // 20 minutes for cardio, 30 reps for strength
      const defaultWeight = cardioWorkout ? undefined : undefined; // No weight for quick complete
      
      // Log the exercise completion
      const success = await logExercise(
        currentWorkoutLog.id,
        workout.name,
        workout.name, // Use machine name as exercise name
        defaultSets,
        defaultReps,
        defaultWeight
      );

      if (success) {
        console.log("Exercise logged successfully, updating local state");
        
        // Play enhanced success sound
        const { audioManager } = await import('@/utils/audioUtils');
        await audioManager.playSetComplete();
        
        // Trigger calendar data refresh for immediate UI update
        const { useCalendarData } = await import('@/hooks/useCalendarData');
        
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
            // Complete the workout log when all exercises are done
            if (currentWorkoutLog) {
              const totals = await calculateActualWorkoutTotals(currentWorkoutLog.id);
              await completeWorkout(currentWorkoutLog.id, totals.actualDuration);
            }
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
    
    if (completedExercises.length === 0) {
      toast.error("Complete at least one exercise to finish your workout.");
      return;
    }

    // Get actual workout totals from database
    const totals = await calculateActualWorkoutTotals(currentWorkoutLog?.id);
    
    if (currentWorkoutLog) {
      await completeWorkout(
        currentWorkoutLog.id, 
        totals.actualDuration || Math.max(completedExercises.length * 5, 10),
        `Finished early - completed ${totals.actualExercises} out of ${todaysWorkouts.length} exercises`
      );
    }
    
    navigate('/workout-summary', {
      state: {
        workoutData: {
          name: "Early Workout Session",
          exercises: totals.actualExercises,
          duration: totals.actualDuration || Math.max(completedExercises.length * 5, 10),
          sets: totals.actualSets,
          totalReps: totals.actualReps,
          totalWeightLifted: totals.actualWeightLifted,
          notes: `Finished early - completed ${totals.actualExercises} out of ${todaysWorkouts.length} exercises`,
          allWorkoutsCompleted: false
        }
      }
    });
  };

  // Stable progress calculation - prevent flickering
  const completedCount = todaysWorkouts.filter(w => w.completed).length;
  const totalExercises = Math.max(1, todaysWorkouts.length) + completedExtraExercises.length; // Ensure minimum 1 to prevent division issues
  const totalCompleted = completedCount + completedExtraExercises.length;
  const progressPercentage = totalCompleted >= totalExercises ? 100 : Math.round((totalCompleted / totalExercises) * 100);
  
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

      {/* Muscle Group Selector and Scan Machine Button */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Select value={currentMuscleGroup} onValueChange={setCurrentMuscleGroup}>
            <SelectTrigger className="flex-1 border-primary/30 hover:border-primary/60">
              <SelectValue placeholder="Select muscle group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chest">Chest</SelectItem>
              <SelectItem value="back">Back</SelectItem>
              <SelectItem value="shoulders">Shoulders</SelectItem>
              <SelectItem value="legs">Legs</SelectItem>
              <SelectItem value="arms">Arms</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="core">Core</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            <p className="font-semibold text-primary">
              {muscleGroupAnalysis.workoutType}
            </p>
            <p className="text-sm text-foreground/70">
              {muscleGroupAnalysis.subtitle ? (
                <>Goal: {muscleGroupAnalysis.subtitle}</>
              ) : (
                <>Goal: {muscleGroupAnalysis.predominantGroup.charAt(0).toUpperCase() + muscleGroupAnalysis.predominantGroup.slice(1)} Development</>
              )}
            </p>
          </div>
          {todaysWorkouts.some(w => w.muscleGroup === 'unknown') && (
            <div title="Data inconsistency detected">
              <AlertTriangle className="h-4 w-4 text-yellow-500 ml-auto" />
            </div>
          )}
        </div>
      </Card>

      {/* Today's Scheduled Workouts */}
      <DailyWorkoutSection
        title="Today's Scheduled Workouts"
        workouts={todaysWorkouts}
        onWorkoutClick={handleWorkoutClick}
        onToggleComplete={toggleWorkoutComplete}
        showTime={true}
      />

      {/* Extra Completed Exercises */}
      {completedExtraExercises.length > 0 && (
        <div className="mt-8">
          <DailyWorkoutSection
            title="Completed Today (Not in Plan)"
            workouts={completedExtraExercises}
            onWorkoutClick={() => {}} // No navigation for completed exercises
            onToggleComplete={() => {}} // No toggle for already completed
            showTime={true}
          />
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
              // Check if all workout exercises are completed
              const allCompleted = todaysWorkouts.every(workout => workout.completed);
              
              // Get actual workout totals from database
              const totals = await calculateActualWorkoutTotals(currentWorkoutLog?.id);
              
              if (currentWorkoutLog) {
                await completeWorkout(
                  currentWorkoutLog.id,
                  totals.actualDuration || 45,
                  "Completed full workout session"
                );
              }
              navigate('/workout-summary', {
                state: {
                  workoutData: {
                    name: "Daily Workout Session",
                    exercises: totals.actualExercises,
                    duration: totals.actualDuration || 45,
                    sets: totals.actualSets,
                    totalReps: totals.actualReps,
                    totalWeightLifted: totals.actualWeightLifted,
                    notes: "",
                    allWorkoutsCompleted: allCompleted
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

      {/* Floating Chat Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Voice Chat Button */}
        <Button
          onClick={() => setIsVoiceChatOpen(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
          size="icon"
          aria-label="Voice chat with Petrie"
        >
          <Phone className="h-5 w-5 text-white" />
        </Button>
        
        {/* Text Chat Button */}
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
          size="icon"
          aria-label="Chat with Petrie"
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Chat Components */}
      <FitnessChatbot 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
      
      <VoiceInterface 
        isOpen={isVoiceChatOpen} 
        onToggle={() => setIsVoiceChatOpen(false)}
      />
    </div>
  );
};

export default WorkoutList;
