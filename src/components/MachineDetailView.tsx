import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Timer, Target, Smartphone, TrendingUp } from 'lucide-react';
import { WorkoutExercise } from '@/hooks/useWorkoutPlan';
import { SmartPuckWorkoutRunner } from './SmartPuckWorkoutRunner';
import { NFCMachinePopup } from './NFCMachinePopup';
import { getMachineImageUrl } from '@/utils/machineImageUtils';
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger';
import { useNavigate } from 'react-router-dom';
import { useMachineHistory } from '@/hooks/useMachineHistory';
import { useMachineSpecs } from '@/hooks/useMachineSpecs';
import { MachineMaxToggle } from './workout/MachineMaxToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface MachineDetailViewProps {
  exercise: WorkoutExercise;
  onBack: () => void;
  onExerciseComplete: (exercise: WorkoutExercise) => void;
  autoConnect?: boolean;
}

interface SetData {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  completed: boolean;
}

const MachineDetailView: React.FC<MachineDetailViewProps> = ({ 
  exercise, 
  onBack, 
  onExerciseComplete,
  autoConnect = false
}) => {
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyPromptShown, setHistoryPromptShown] = useState(false);
  
  const { history, loading: historyLoading } = useMachineHistory(exercise.machine);
  const { specs, userMax, contributeSpec, updateUserMax } = useMachineSpecs(exercise.machine);
  
  const [sets, setSets] = useState<SetData[]>(() => {
    // Use calculated weight if available, otherwise fallback to exercise weight or reasonable default
    const defaultWeight = (exercise as any).calculated_weight || exercise.weight || 20;
    
    return Array.from({ length: exercise.sets || 3 }, (_, i) => ({
      setNumber: i + 1,
      targetReps: exercise.reps || 12,
      actualReps: exercise.reps || 12,
      weight: defaultWeight,
      completed: false
    }));
  });
  
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // Workout logging
  const { currentWorkoutLog, startWorkout, logExercise, completeWorkout } = useWorkoutLogger();
  const navigate = useNavigate();

  // Show history prompt when component loads if there's previous data
  useEffect(() => {
    if (!historyLoading && history && !historyPromptShown && history.lastWeight > 0) {
      setShowHistoryDialog(true);
      setHistoryPromptShown(true);
    }
  }, [historyLoading, history, historyPromptShown]);

  const handleUsePreviousWeight = () => {
    if (history) {
      const newSets = sets.map(set => ({
        ...set,
        weight: history.lastWeight,
        targetReps: history.lastReps,
        actualReps: history.lastReps
      }));
      setSets(newSets);
      
      const date = new Date(history.lastWorkoutDate);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
      
      toast.success(`Weight set to ${history.lastWeight} lbs from ${formattedDate}`, {
        icon: <TrendingUp className="h-4 w-4" />
      });
    }
    setShowHistoryDialog(false);
  };

  const handleSkipPreviousWeight = () => {
    setShowHistoryDialog(false);
  };

  const completedSets = sets.filter(set => set.completed).length;
  const progressPercentage = (completedSets / sets.length) * 100;

  const handleSetComplete = (setIndex: number) => {
    const newSets = [...sets];
    newSets[setIndex].completed = true;
    setSets(newSets);

    // Start rest timer if not the last set
    if (setIndex < sets.length - 1) {
      setRestTimer(exercise.rest_seconds || 60);
      setIsResting(true);
      
      const timer = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleSetEdit = (setIndex: number, field: 'actualReps' | 'weight', value: number) => {
    const newSets = [...sets];
    newSets[setIndex][field] = value;
    setSets(newSets);
  };

  const handleCompleteExercise = async () => {
    try {
      const weightUsed = sets[0]?.weight ?? (exercise as any).calculated_weight ?? exercise.weight;
      const repsCompleted = sets.reduce((sum, set) => sum + (set.completed ? set.actualReps : 0), 0);
      const setsCompleted = completedSets;
      
      const activeLog = currentWorkoutLog ?? await startWorkout(exercise.machine, exercise.exercise_type || 'strength', 1);
      if (activeLog) {
        await logExercise(
          activeLog.id,
          exercise.machine,
          exercise.machine,
          setsCompleted,
          repsCompleted,
          weightUsed ? Math.round(weightUsed) : undefined
        );
        await completeWorkout(activeLog.id);
      }
      
      // Update user's typical weight and reps for this machine
      if (weightUsed && repsCompleted > 0) {
        try {
          await updateUserMax(
            userMax?.is_at_machine_max || false,
            userMax?.is_at_machine_min || false,
            weightUsed,
            Math.round(repsCompleted / setsCompleted),
            weightUsed
          );
        } catch (e) {
          console.error('Failed to update user machine max:', e);
        }
      }
    } catch (e) {
      console.error('Failed to persist workout session', e);
    } finally {
      onExerciseComplete(exercise);
      onBack();
    }
  };

  const handleContributeSpec = async (maxWeight?: number, minWeight?: number) => {
    await contributeSpec(maxWeight, minWeight);
  };

  const handleUpdateUserMax = async (isMax: boolean, isMin: boolean, weight?: number) => {
    const currentWeight = sets[0]?.weight || 0;
    const avgReps = Math.round(sets.reduce((sum, s) => sum + s.actualReps, 0) / sets.length);
    await updateUserMax(isMax, isMin, weight || currentWeight, avgReps, currentWeight);
  };

  const getWorkoutIdForMachine = (name: string): string | null => {
    const n = name.toLowerCase();
    if (n.includes('pec deck')) return '2';
    if (n.includes('incline') && n.includes('press')) return '3';
    if (n.includes('decline') && n.includes('press')) return '4';
    if (n.includes('cable') && n.includes('crossover')) return '5';
    if (n.includes('smith')) return '6';
    if (n.includes('seated dip')) return '7';
    if (n.includes('assisted') && n.includes('dip')) return '8';
    if (n.includes('chest press')) return '1';
    return null;
  };

  const handleStart = async () => {
    try {
      if (!currentWorkoutLog) {
        await startWorkout('Ad-hoc Workout', exercise.exercise_type || 'strength', 1);
      }
      const id = getWorkoutIdForMachine(exercise.machine);
      if (id) {
        navigate(`/workout/${id}?autoConnect=puck`);
      } else {
        navigate('/workout-list');
      }
    } catch (e) {
      console.error('Failed to start ad-hoc workout', e);
      navigate('/workout-list');
    }
  };

  const allSetsCompleted = completedSets === sets.length;

  const machineImageUrl = getMachineImageUrl(exercise.machine);

  return (
    <>
      <AlertDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Previous Workout Found
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div>
                Last time you used <span className="font-semibold text-foreground">{exercise.machine}</span>, you lifted:
              </div>
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Weight</span>
                  <span className="text-2xl font-bold text-primary">{history?.lastWeight} lbs</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Sets × Reps</span>
                  <span className="font-semibold text-foreground">{history?.lastSets} × {history?.lastReps}</span>
                </div>
                {history?.lastWorkoutDate && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    {new Date(history.lastWorkoutDate).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: new Date(history.lastWorkoutDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </div>
                )}
              </div>
              <div className="text-sm">
                Would you like to start with this weight today?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipPreviousWeight}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUsePreviousWeight}>
              Use Previous Weight
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workout
        </Button>
        {isResting && (
          <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
            <Timer className="h-4 w-4" />
            <span className="font-medium">Rest: {restTimer}s</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md">
              <img 
                src={machineImageUrl} 
                alt={exercise.machine}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png';
                }}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{exercise.machine}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {exercise.exercise_type || 'Strength'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {exercise.intensity || 'Medium'} Intensity
                </Badge>
                <NFCMachinePopup machineId={exercise.machine.toLowerCase().replace(/\s+/g, '-')} machineName={exercise.machine}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-12 text-xs bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600"
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                </NFCMachinePopup>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedSets}/{sets.length} sets
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{sets.length}</div>
                <div className="text-xs text-muted-foreground">Sets</div>
              </div>
              <div>
                <div className="text-lg font-bold">{exercise.reps}</div>
                <div className="text-xs text-muted-foreground">Target Reps</div>
              </div>
              <div>
                <div className="text-lg font-bold">{exercise.rest_seconds || 60}s</div>
                <div className="text-xs text-muted-foreground">Rest</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machine Max/Min Toggles - Crowdsourced */}
      <MachineMaxToggle
        machineName={exercise.machine}
        currentWeight={sets[0]?.weight || 0}
        specs={specs}
        userMax={userMax}
        onContributeSpec={handleContributeSpec}
        onUpdateUserMax={handleUpdateUserMax}
      />

      {/* Smart Puck Workout Runner */}
      <div className="space-y-3">
        <h3 className="font-semibold">Smart Puck Workout</h3>
        <SmartPuckWorkoutRunner autoConnect={autoConnect} onDone={handleCompleteExercise} onStart={handleStart} />
      </div>

      </div>
    </>
  );
};

export default MachineDetailView;