import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Timer, Target, Smartphone } from 'lucide-react';
import { WorkoutExercise } from '@/hooks/useWorkoutPlan';
import { SmartPuckWorkoutRunner } from './SmartPuckWorkoutRunner';
import { NFCMachinePopup } from './NFCMachinePopup';
import { getMachineImageUrl } from '@/utils/machineImageUtils';
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger';
import { useNavigate } from 'react-router-dom';

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
      const activeLog = currentWorkoutLog ?? await startWorkout(exercise.machine, exercise.exercise_type || 'strength', 1);
      if (activeLog) {
        await logExercise(
          activeLog.id,
          exercise.machine,
          exercise.machine,
          4,
          40,
          weightUsed ? Math.round(weightUsed) : undefined
        );
        await completeWorkout(activeLog.id);
      }
    } catch (e) {
      console.error('Failed to persist workout session', e);
    } finally {
      onExerciseComplete(exercise);
      onBack();
    }
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

      {/* Smart Puck Workout Runner */}
      <div className="space-y-3">
        <h3 className="font-semibold">Smart Puck Workout</h3>
        <SmartPuckWorkoutRunner autoConnect={autoConnect} onDone={handleCompleteExercise} onStart={handleStart} />
      </div>

    </div>
  );
};

export default MachineDetailView;