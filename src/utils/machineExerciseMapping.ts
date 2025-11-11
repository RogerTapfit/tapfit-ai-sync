import { type ExerciseType } from './exerciseDetection';

export interface MachineExerciseCompatibility {
  machineId: string;
  exercises: ExerciseType[];
  defaultExercise: ExerciseType;
  context: string; // e.g., "warm-up alternative" or "bodyweight version"
}

export const BODYWEIGHT_COMPATIBLE_MACHINES: Record<string, MachineExerciseCompatibility> = {
  'MCH-BENCH-PRESS': {
    machineId: 'MCH-BENCH-PRESS',
    exercises: ['pushups'],
    defaultExercise: 'pushups',
    context: 'bodyweight chest exercise'
  },
  'MCH-SMITH-MACHINE': {
    machineId: 'MCH-SMITH-MACHINE',
    exercises: ['pushups', 'squats'],
    defaultExercise: 'pushups',
    context: 'warm-up alternative'
  },
  'MCH-LEG-PRESS': {
    machineId: 'MCH-LEG-PRESS',
    exercises: ['squats'],
    defaultExercise: 'squats',
    context: 'bodyweight leg exercise'
  },
  'MCH-FIXED-BARBELL-RACK': {
    machineId: 'MCH-FIXED-BARBELL-RACK',
    exercises: ['pushups', 'squats'],
    defaultExercise: 'squats',
    context: 'warm-up alternative'
  }
};

export const isMachineBodyweightCompatible = (machineId: string): boolean => {
  return machineId in BODYWEIGHT_COMPATIBLE_MACHINES;
};

export const getMachineExercises = (machineId: string): MachineExerciseCompatibility | null => {
  return BODYWEIGHT_COMPATIBLE_MACHINES[machineId] || null;
};

export const getExerciseDisplayName = (exerciseType: ExerciseType): string => {
  const names: Record<ExerciseType, string> = {
    'pushups': 'Push-ups',
    'squats': 'Squats',
    'lunges': 'Lunges',
    'jumping_jacks': 'Jumping Jacks',
    'high_knees': 'High Knees'
  };
  return names[exerciseType] || exerciseType;
};

export const getExerciseIcon = (exerciseType: ExerciseType): string => {
  const icons: Record<ExerciseType, string> = {
    'pushups': '💪',
    'squats': '🦵',
    'lunges': '🏃',
    'jumping_jacks': '⭐',
    'high_knees': '🔥'
  };
  return icons[exerciseType] || '💪';
};
