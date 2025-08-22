import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealTimeRepCounter } from '@/components/RealTimeRepCounter';
import { ArrowLeft, Info, Settings } from 'lucide-react';

type MachineId = 'LEGEXT01' | 'CHESTPRESS01' | 'LATPULL01' | 'SHOULDERPRESS01' | 'LEGPRESS01' | 'BICEP01' | 'TRICEP01' | 'SQUAT01';

const machineDetails: Record<MachineId, {
  name: string;
  muscleGroup: string;
  description: string;
  targetReps: number;
  targetSets: number;
  restTime: number;
  instructions: string[];
}> = {
  'LEGEXT01': {
    name: 'Leg Extension',
    muscleGroup: 'Quadriceps',
    description: 'Isolated quadriceps strengthening exercise',
    targetReps: 12,
    targetSets: 3,
    restTime: 60,
    instructions: [
      'Sit on the machine with your back against the pad',
      'Position your legs under the padded lever',
      'Extend your legs until they are straight',
      'Slowly lower back to starting position'
    ]
  },
  'CHESTPRESS01': {
    name: 'Chest Press',
    muscleGroup: 'Chest',
    description: 'Compound chest strengthening exercise',
    targetReps: 10,
    targetSets: 3,
    restTime: 90,
    instructions: [
      'Sit with your back firmly against the pad',
      'Grip handles at chest level',
      'Press forward until arms are extended',
      'Return to starting position with control'
    ]
  },
  'LATPULL01': {
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    description: 'Upper back and latissimus dorsi exercise',
    targetReps: 10,
    targetSets: 3,
    restTime: 75,
    instructions: [
      'Sit with thighs secured under the pad',
      'Grip the bar with wide overhand grip',
      'Pull the bar down to your upper chest',
      'Slowly return to starting position'
    ]
  },
  'SHOULDERPRESS01': {
    name: 'Shoulder Press',
    muscleGroup: 'Shoulders',
    description: 'Overhead shoulder strengthening exercise',
    targetReps: 8,
    targetSets: 3,
    restTime: 90,
    instructions: [
      'Sit with back against the pad',
      'Grip handles at shoulder height',
      'Press up until arms are extended overhead',
      'Lower with control to starting position'
    ]
  },
  'LEGPRESS01': {
    name: 'Leg Press',
    muscleGroup: 'Legs',
    description: 'Compound lower body exercise',
    targetReps: 15,
    targetSets: 3,
    restTime: 120,
    instructions: [
      'Sit in machine with back against pad',
      'Place feet shoulder-width apart on platform',
      'Lower the weight by bending your knees',
      'Press back to starting position'
    ]
  },
  'BICEP01': {
    name: 'Bicep Curl',
    muscleGroup: 'Biceps',
    description: 'Isolated bicep strengthening exercise',
    targetReps: 12,
    targetSets: 3,
    restTime: 60,
    instructions: [
      'Sit with arms positioned on the pad',
      'Grip the handles with underhand grip',
      'Curl the weight up towards your shoulders',
      'Lower slowly to starting position'
    ]
  },
  'TRICEP01': {
    name: 'Tricep Extension',
    muscleGroup: 'Triceps',
    description: 'Isolated tricep strengthening exercise',
    targetReps: 12,
    targetSets: 3,
    restTime: 60,
    instructions: [
      'Sit with back against the pad',
      'Grip handles with arms at 90 degrees',
      'Extend arms downward fully',
      'Return to starting position with control'
    ]
  },
  'SQUAT01': {
    name: 'Squat Rack',
    muscleGroup: 'Full Body',
    description: 'Compound full-body exercise',
    targetReps: 8,
    targetSets: 3,
    restTime: 180,
    instructions: [
      'Position bar on your upper back',
      'Stand with feet shoulder-width apart',
      'Lower by bending hips and knees',
      'Return to standing position'
    ]
  }
};

export default function MachineWorkout() {
  const { machineId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();
  
  const machine = machineId ? machineDetails[machineId as MachineId] : null;

  if (!machine) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Machine not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleWorkoutComplete = () => {
    navigate('/workout-summary', { 
      state: { 
        machineId, 
        machineName: machine.name,
        completedSets: machine.targetSets,
        totalReps: machine.targetSets * machine.targetReps
      }
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{machine.name}</h1>
          <p className="text-muted-foreground">{machine.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Machine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary">{machine.muscleGroup}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Target Sets:</span>
                  <span className="text-sm">{machine.targetSets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Reps per Set:</span>
                  <span className="text-sm">{machine.targetReps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rest Time:</span>
                  <span className="text-sm">{machine.restTime}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {machine.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Rep Counter */}
        <div className="lg:col-span-2">
          <RealTimeRepCounter
            targetReps={machine.targetReps}
            targetSets={machine.targetSets}
            onWorkoutComplete={handleWorkoutComplete}
          />
        </div>
      </div>
    </div>
  );
}