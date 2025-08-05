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
  Compass,
  Smartphone
} from 'lucide-react';
import { ScheduledWorkout, WorkoutExercise } from '@/hooks/useWorkoutPlan';
import MachineDetailView from './MachineDetailView';
import { NFCMachinePopup } from './NFCMachinePopup';

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
  const getMachineImageUrl = (machineName: string) => {
    const name = machineName.toLowerCase();
    
    // Map machine names to generic machine images for now
    if (name.includes('chest') && name.includes('press')) return '/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png';
    if (name.includes('pec') && name.includes('deck')) return '/lovable-uploads/28009a8a-51b5-4196-bd00-c1ad68b67bc0.png';
    if (name.includes('incline')) return '/lovable-uploads/29c29f8b-9b3a-4013-ac88-068a86133fae.png';
    if (name.includes('decline')) return '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png';
    if (name.includes('cable') && name.includes('crossover')) return '/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png';
    if (name.includes('smith') && name.includes('machine')) return '/lovable-uploads/461c8b1b-3cee-4b38-b257-23671d035d6d.png';
    if (name.includes('seated') && name.includes('dip')) return '/lovable-uploads/53858814-478c-431c-8c54-feecf0b00e19.png';
    if (name.includes('assisted') && name.includes('dip')) return '/lovable-uploads/55d72a0c-1e5a-4d6f-abfa-edfe80701063.png';
    if (name.includes('leg') && name.includes('press')) return '/lovable-uploads/61f89507-de07-4a05-82a5-5114ac500e76.png';
    if (name.includes('squat')) return '/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png';
    if (name.includes('lat') && name.includes('pulldown')) return '/lovable-uploads/72acfefe-3a0e-4d74-b92f-ce88b0a38d7e.png';
    if (name.includes('row')) return '/lovable-uploads/81dac889-b82f-4359-a3a6-a77b066d007c.png';
    if (name.includes('shoulder') && name.includes('press')) return '/lovable-uploads/8b855abd-c6fe-4cef-9549-7c3a6cd70fae.png';
    if (name.includes('tricep')) return '/lovable-uploads/9b6efa63-f917-4f9e-8b82-31076b66aff5.png';
    if (name.includes('bicep') && name.includes('curl')) return '/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png';
    if (name.includes('leg') && name.includes('curl')) return '/lovable-uploads/ac6dd467-37ab-4e6a-9ecc-d7e6ecb97913.png';
    if (name.includes('leg') && name.includes('extension')) return '/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png';
    if (name.includes('calf')) return '/lovable-uploads/c38c89e5-0aa7-45e8-954a-109f4e471db7.png';
    if (name.includes('deadlift')) return '/lovable-uploads/ee18485a-269f-4a98-abe3-54fab538f201.png';
    if (name.includes('pull') && name.includes('up')) return '/lovable-uploads/f42105be-a95d-44b0-8d72-a77b6cbffee1.png';
    
    // Default fallback image
    return '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png';
  };

  const machineImageUrl = getMachineImageUrl(exercise.machine);
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      onClick={() => onMachineClick(exercise)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
            <img 
              src={machineImageUrl} 
              alt={exercise.machine}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base truncate">{exercise.machine}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Primary: {exercise.exercise_type || 'Strength Training'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className="text-xs">
                  #{index + 1}
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