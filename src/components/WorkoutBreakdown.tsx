import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Activity, 
  Dumbbell,
  Zap,
  Circle,
  RotateCcw,
  Footprints,
  Waves,
  Mountain,
  TrendingUp,
  Repeat,
  Timer,
  Compass
} from 'lucide-react';
import { ScheduledWorkout, WorkoutExercise } from '@/hooks/useWorkoutPlan';
import MachineDetailView from './MachineDetailView';

interface WorkoutBreakdownProps {
  workout: ScheduledWorkout | null;
  onBack: () => void;
}

interface MachineCardProps {
  exercise: WorkoutExercise;
  index: number;
  onMachineClick: (exercise: WorkoutExercise) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ exercise, index, onMachineClick }) => {
  const getExerciseIcon = (machineName: string) => {
    const name = machineName.toLowerCase();
    
    if (name.includes('squat')) return Zap;
    if (name.includes('calf')) return TrendingUp;
    if (name.includes('twist') || name.includes('russian')) return RotateCcw;
    if (name.includes('leg') && name.includes('raise')) return Footprints;
    if (name.includes('deadlift')) return Mountain;
    if (name.includes('bench')) return Circle;
    if (name.includes('row')) return Waves;
    if (name.includes('press')) return TrendingUp;
    if (name.includes('curl')) return Repeat;
    if (name.includes('pull')) return TrendingUp;
    if (name.includes('lat')) return Mountain;
    if (name.includes('tricep')) return Timer;
    if (name.includes('bicep')) return Repeat;
    if (name.includes('shoulder')) return Compass;
    if (name.includes('chest')) return Circle;
    if (name.includes('back')) return Mountain;
    if (name.includes('abs') || name.includes('core')) return RotateCcw;
    
    return Dumbbell; // Default icon
  };

  const ExerciseIcon = getExerciseIcon(exercise.machine);
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      onClick={() => onMachineClick(exercise)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <ExerciseIcon className="h-8 w-8 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base truncate">{exercise.machine}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Primary: {exercise.exercise_type || 'Strength Training'}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs ml-2">
                #{index + 1}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span>{exercise.sets || 3} × {exercise.reps || 12}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{exercise.rest_seconds || 60}s rest</span>
              </div>
              {exercise.duration_minutes && (
                <div className="flex items-center gap-1 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>{exercise.duration_minutes} min</span>
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <Badge 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                <Target className="h-3 w-3 mr-1" />
                Click to start exercise
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const WorkoutBreakdown: React.FC<WorkoutBreakdownProps> = ({ workout, onBack }) => {
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const handleMachineClick = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
  };

  const handleBackToWorkout = () => {
    setSelectedExercise(null);
  };

  const handleExerciseComplete = (exercise: WorkoutExercise) => {
    setCompletedExercises(prev => new Set(prev).add(exercise.machine));
  };

  if (selectedExercise) {
    return (
      <MachineDetailView
        exercise={selectedExercise}
        onBack={handleBackToWorkout}
        onExerciseComplete={handleExerciseComplete}
      />
    );
  }
  if (!workout) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workout Plan
        </Button>
        <div className="text-center text-muted-foreground">
          No workout selected
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workout Plan
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{workout.duration} min</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold capitalize">
          {workout.day}'s {workout.muscle_group.replace('_', ' ')} Exercises
        </h2>
        <p className="text-muted-foreground">
          Complete the exercises below in order
        </p>
      </div>

      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => (
          <MachineCard
            key={index}
            exercise={exercise}
            index={index}
            onMachineClick={handleMachineClick}
          />
        ))}
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Workout Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Warm up for 5-10 minutes before starting
          </p>
          <p className="text-sm text-muted-foreground">
            • Focus on proper form over heavy weight
          </p>
          <p className="text-sm text-muted-foreground">
            • Stay hydrated throughout your workout
          </p>
          <p className="text-sm text-muted-foreground">
            • Cool down and stretch after completing the session
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutBreakdown;