import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Timer, CheckCircle2, Target, Weight, Repeat, Check } from 'lucide-react';
import { WorkoutExercise } from '@/hooks/useWorkoutPlan';
import { LiveWorkoutSession } from './LiveWorkoutSession';

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

  const handleCompleteExercise = () => {
    onExerciseComplete(exercise);
    onBack();
  };

  const allSetsCompleted = completedSets === sets.length;

  // Machine image fallback
  const machineImageUrl = '/placeholder.svg'; // Will be updated when machine images are available

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
            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={machineImageUrl} 
                alt={exercise.machine}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
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

      <div className="space-y-3">
        <h3 className="font-semibold">Sets</h3>
        {sets.map((set, index) => (
          <Card key={index} className={`${set.completed ? 'bg-green-50 border-green-200' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    set.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-muted-foreground/30'
                  }`}>
                    {set.completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{set.setNumber}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">Set {set.setNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Target: {set.targetReps} reps
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Repeat className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="number"
                      value={set.actualReps}
                      onChange={(e) => handleSetEdit(index, 'actualReps', parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-sm border rounded text-foreground bg-background"
                      disabled={set.completed}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Weight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => handleSetEdit(index, 'weight', parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-sm border rounded text-foreground bg-background"
                      disabled={set.completed}
                    />
                    <span className="text-xs text-muted-foreground flex-shrink-0">lbs</span>
                  </div>
                  {!set.completed && (
                    <Button
                      size="icon"
                      onClick={() => handleSetComplete(index)}
                      className="flex-shrink-0 h-8 w-8"
                      aria-label="Complete set"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Focus on proper form and controlled movements. Warm up with lighter weight before increasing intensity.
          </p>
        </CardContent>
      </Card>

      {/* BLE Sensor Integration */}
      <LiveWorkoutSession autoConnect={autoConnect} />

      {allSetsCompleted && (
        <Button 
          onClick={handleCompleteExercise}
          className="w-full"
          size="lg"
        >
          Complete Exercise
        </Button>
      )}
    </div>
  );
};

export default MachineDetailView;