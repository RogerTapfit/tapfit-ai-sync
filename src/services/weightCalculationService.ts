export interface UserWeightProfile {
  weight_lbs: number;
  age: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  primary_goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training';
  gender?: string;
  current_max_weights?: Record<string, number>;
}

export interface ExerciseWeightCalculation {
  exercise_name: string;
  machine_name: string;
  recommended_weight: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  confidence?: 'high' | 'medium' | 'learning';
}

export interface WeightRecommendationInput {
  userProfile: UserWeightProfile;
  exerciseList: Array<{
    name: string;
    machine: string;
    muscle_group: string;
  }>;
}

export interface WeightRecommendationOutput {
  exercises: ExerciseWeightCalculation[];
  overall_confidence: 'high' | 'medium' | 'learning';
  adjustment_suggestions: string[];
}

// Base multipliers for weight calculations (percentage of bodyweight)
const BASE_FACTORS = {
  beginner: 0.5,    // 50% of bodyweight as starting point
  intermediate: 0.8, // 80% of bodyweight 
  advanced: 1.2     // 120% of bodyweight
} as const;

const GOAL_MULTIPLIERS = {
  fat_loss: 0.9,
  muscle_building: 1.1,
  general_fitness: 1.0,
  strength_training: 1.25
} as const;

// Exercise-specific modifiers (relative to bodyweight baseline)
const EXERCISE_MODIFIERS = {
  // Upper body exercises - more realistic ratios
  'chest_press': 0.8,
  'bench_press': 0.75,
  'shoulder_press': 0.6,
  'lat_pulldown': 0.7,
  'seated_row': 0.7,
  'bicep_curl': 0.3,
  'tricep_extension': 0.35,
  
  // Lower body exercises - much stronger than upper body
  'leg_press': 2.2,  // Legs can handle 2-3x bodyweight easily
  'squat': 1.0,
  'leg_curl': 0.5,
  'leg_extension': 0.6,
  'calf_raise': 1.0,
  
  // Default for unlisted exercises
  'default': 0.7
} as const;

// Minimum weight floors for each exercise type (in lbs)
const MINIMUM_WEIGHTS = {
  // Upper body minimums
  'chest_press': 30,
  'bench_press': 45,
  'shoulder_press': 25,
  'lat_pulldown': 40,
  'seated_row': 35,
  'bicep_curl': 15,
  'tricep_extension': 15,
  
  // Lower body minimums
  'leg_press': 80,
  'squat': 45,
  'leg_curl': 25,
  'leg_extension': 30,
  'calf_raise': 45,
  
  // Default minimum
  'default': 25
} as const;

// Gender modifiers
const GENDER_MODIFIERS = {
  male: 1.0,
  female: 0.75,
  other: 0.85
} as const;

/**
 * Calculate optimal starting weight for an exercise
 */
export function calculateOptimalWeight(
  userProfile: UserWeightProfile,
  exerciseName: string,
  machineName: string
): number {
  const {
    weight_lbs,
    age,
    experience_level,
    primary_goal,
    gender = 'other',
    current_max_weights = {}
  } = userProfile;

  // Check if user has a recorded max for this exercise
  const maxWeightKey = `${machineName}_${exerciseName}`.toLowerCase().replace(/\s+/g, '_');
  if (current_max_weights[maxWeightKey]) {
    // Use percentage of max based on goal and experience
    const maxWeight = current_max_weights[maxWeightKey];
    const percentageOfMax = getPercentageOfMax(experience_level, primary_goal);
    return Math.round(maxWeight * percentageOfMax);
  }

  // Calculate base weight using formula
  const baseFactor = BASE_FACTORS[experience_level];
  const goalMultiplier = GOAL_MULTIPLIERS[primary_goal];
  const genderModifier = GENDER_MODIFIERS[gender as keyof typeof GENDER_MODIFIERS] || GENDER_MODIFIERS.other;
  
  // Age adjustment: decrease 1% for every year over 25, increase for under
  const ageAdjustment = (age - 25) * 0.01;
  const ageModifier = Math.max(0.5, 1 - ageAdjustment); // Minimum 50% modifier
  
  // Get exercise-specific modifier
  const exerciseModifierKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exerciseModifier = EXERCISE_MODIFIERS[exerciseModifierKey as keyof typeof EXERCISE_MODIFIERS] || EXERCISE_MODIFIERS.default;
  
  // Calculate final weight using bodyweight directly (already in lbs)
  const baseWeight = weight_lbs * baseFactor * goalMultiplier * genderModifier * ageModifier * exerciseModifier;
  
  // Round to nearest 5 lbs
  const roundedWeight = Math.round(baseWeight / 5) * 5;
  
  // Apply minimum weight floor for this exercise
  const minimumWeightKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
  const minimumWeight = MINIMUM_WEIGHTS[minimumWeightKey as keyof typeof MINIMUM_WEIGHTS] || MINIMUM_WEIGHTS.default;
  
  return Math.max(minimumWeight, roundedWeight);
}

/**
 * Get percentage of max lift to use based on experience and goal
 */
function getPercentageOfMax(
  experience: 'beginner' | 'intermediate' | 'advanced',
  goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training'
): number {
  const basePercentages = {
    beginner: 0.6,    // 60% of max
    intermediate: 0.7, // 70% of max
    advanced: 0.8     // 80% of max
  };

  const goalAdjustments = {
    fat_loss: -0.1,          // Lower intensity for fat loss
    muscle_building: 0,      // Standard intensity
    general_fitness: -0.05,  // Slightly lower intensity
    strength_training: 0.1   // Higher intensity for strength
  };

  const basePercentage = basePercentages[experience];
  const adjustment = goalAdjustments[goal];
  
  return Math.min(0.85, Math.max(0.5, basePercentage + adjustment));
}

/**
 * Calculate sets and reps based on user goal and experience
 */
export function calculateSetsAndReps(
  goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training',
  experience: 'beginner' | 'intermediate' | 'advanced',
  exerciseType: 'compound' | 'isolation' = 'compound'
): { sets: number; reps: number; rest_seconds: number } {
  const programs = {
    fat_loss: {
      beginner: { sets: 2, reps: 15, rest: 45 },
      intermediate: { sets: 3, reps: 12, rest: 60 },
      advanced: { sets: 4, reps: 10, rest: 45 }
    },
    muscle_building: {
      beginner: { sets: 3, reps: 10, rest: 60 },
      intermediate: { sets: 4, reps: 8, rest: 90 },
      advanced: { sets: 4, reps: 6, rest: 120 }
    },
    general_fitness: {
      beginner: { sets: 2, reps: 12, rest: 60 },
      intermediate: { sets: 3, reps: 10, rest: 75 },
      advanced: { sets: 3, reps: 8, rest: 90 }
    },
    strength_training: {
      beginner: { sets: 3, reps: 8, rest: 90 },
      intermediate: { sets: 4, reps: 5, rest: 180 },
      advanced: { sets: 5, reps: 3, rest: 240 }
    }
  };

  const baseProgram = programs[goal][experience];
  
  // Adjust for isolation exercises (typically higher reps, shorter rest)
  if (exerciseType === 'isolation') {
    return {
      sets: baseProgram.sets,
      reps: Math.min(20, baseProgram.reps + 3),
      rest_seconds: Math.max(30, baseProgram.rest - 15)
    };
  }

  return {
    sets: baseProgram.sets,
    reps: baseProgram.reps,
    rest_seconds: baseProgram.rest
  };
}

/**
 * Determine if an exercise should progress weight based on performance
 */
export function shouldProgressWeight(
  completionPercentage: number,
  perceivedExertion: number,
  weeksAtCurrentWeight: number
): { shouldProgress: boolean; progressionType: 'increase' | 'decrease' | 'maintain'; percentage: number } {
  // If completion rate is very low, decrease weight
  if (completionPercentage < 70) {
    return {
      shouldProgress: true,
      progressionType: 'decrease',
      percentage: -10
    };
  }

  // If completion rate is high and exertion is low, increase weight
  if (completionPercentage >= 90 && perceivedExertion <= 3 && weeksAtCurrentWeight >= 1) {
    return {
      shouldProgress: true,
      progressionType: 'increase',
      percentage: 5
    };
  }

  // If stuck at same weight for too long with decent performance, small increase
  if (weeksAtCurrentWeight >= 3 && completionPercentage >= 80) {
    return {
      shouldProgress: true,
      progressionType: 'increase',
      percentage: 2.5
    };
  }

  return {
    shouldProgress: false,
    progressionType: 'maintain',
    percentage: 0
  };
}

/**
 * Calculate new weight based on progression decision
 */
export function calculateProgressedWeight(
  currentWeight: number,
  progressionPercentage: number
): number {
  const newWeight = currentWeight * (1 + progressionPercentage / 100);
  // Round to nearest 5lbs
  return Math.round(newWeight / 5) * 5;
}

/**
 * Generate complete weight recommendations for all exercises
 */
export function generateCompleteWeightRecommendations(
  input: WeightRecommendationInput
): WeightRecommendationOutput {
  const { userProfile, exerciseList } = input;
  
  const exercises: ExerciseWeightCalculation[] = exerciseList.map(exercise => {
    const weight = calculateOptimalWeight(userProfile, exercise.name, exercise.machine);
    const { sets, reps, rest_seconds } = calculateSetsAndReps(
      userProfile.primary_goal,
      userProfile.experience_level
    );

    // Determine confidence based on available data
    let confidence: 'high' | 'medium' | 'learning' = 'learning';
    if (userProfile.current_max_weights && Object.keys(userProfile.current_max_weights).length > 2) {
      confidence = 'high';
    } else if (userProfile.experience_level !== 'beginner') {
      confidence = 'medium';
    }

    return {
      exercise_name: exercise.name,
      machine_name: exercise.machine,
      recommended_weight: weight,
      sets,
      reps,
      rest_seconds,
      confidence
    };
  });

  // Determine overall confidence
  const highConfidenceCount = exercises.filter(e => e.confidence === 'high').length;
  const mediumConfidenceCount = exercises.filter(e => e.confidence === 'medium').length;
  
  let overall_confidence: 'high' | 'medium' | 'learning' = 'learning';
  if (highConfidenceCount > exercises.length / 2) {
    overall_confidence = 'high';
  } else if (mediumConfidenceCount + highConfidenceCount > exercises.length / 2) {
    overall_confidence = 'medium';
  }

  // Generate suggestions
  const adjustment_suggestions = [];
  if (userProfile.experience_level === 'beginner') {
    adjustment_suggestions.push('Focus on proper form over heavy weight');
    adjustment_suggestions.push('Start with lighter weights and gradually increase');
  }
  if (overall_confidence === 'learning') {
    adjustment_suggestions.push('We\'ll learn your preferences and adjust automatically');
  }
  adjustment_suggestions.push('Weights will auto-adjust based on your workout performance');

  return {
    exercises,
    overall_confidence,
    adjustment_suggestions
  };
}