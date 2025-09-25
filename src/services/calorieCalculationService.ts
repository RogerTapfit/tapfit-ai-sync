interface UserProfile {
  weight_lbs?: number;
  age?: number;
  gender?: string;
  height_cm?: number;
}

interface WorkoutData {
  duration_minutes?: number;
  muscle_group: string;
  total_reps: number;
  completed_exercises: number;
}

export class CalorieCalculationService {
  // Base metabolic equivalent (MET) values for different exercise types
  private static readonly MET_VALUES = {
    'Chest': 6.0,
    'Back': 5.5,
    'Legs': 7.0,
    'Shoulders': 5.0,
    'Arms': 4.5,
    'Abs': 4.0,
    'Cardio': 8.0,
    'Full Body': 6.5,
    'default': 5.5
  };

  // Calculate calories burned from workout
  static calculateWorkoutCalories(
    workoutData: WorkoutData,
    userProfile: UserProfile
  ): number {
    const { duration_minutes, muscle_group, total_reps, completed_exercises } = workoutData;
    const { weight_lbs = 154, age = 30, gender = 'male' } = userProfile;

    // Get MET value for muscle group
    const metValue = this.MET_VALUES[muscle_group as keyof typeof this.MET_VALUES] || this.MET_VALUES.default;
    
    // Base calculation: MET * weight_kg * time_hours (convert lbs to kg for calculation)
    const weight_kg = weight_lbs * 0.453592;
    const timeHours = (duration_minutes || 30) / 60;
    let baseCalories = metValue * weight_kg * timeHours;

    // Adjust for gender (men typically burn 10-15% more calories)
    if (gender === 'male') {
      baseCalories *= 1.1;
    }

    // Adjust for age (metabolism decreases with age)
    const ageMultiplier = age < 30 ? 1.05 : age > 50 ? 0.95 : 1.0;
    baseCalories *= ageMultiplier;

    // Adjust based on workout intensity (reps and exercises completed)
    const intensityMultiplier = this.calculateIntensityMultiplier(total_reps, completed_exercises);
    baseCalories *= intensityMultiplier;

    return Math.round(baseCalories);
  }

  // Calculate calories burned from steps (Apple Watch data)
  static calculateStepCalories(
    steps: number,
    userProfile: UserProfile
  ): number {
    const { weight_lbs = 154, gender = 'male' } = userProfile;
    
    // Convert to kg for calculation
    const weight_kg = weight_lbs * 0.453592;
    
    // Base calories per step varies by weight and gender
    let caloriesPerStep = 0.04; // Base value
    
    // Adjust for weight (heavier people burn more calories per step)
    if (weight_kg > 80) {
      caloriesPerStep = 0.055;
    } else if (weight_kg > 65) {
      caloriesPerStep = 0.045;
    }
    
    // Gender adjustment
    if (gender === 'male') {
      caloriesPerStep *= 1.1;
    }

    return Math.round(steps * caloriesPerStep);
  }

  // Calculate total daily calories burned
  static calculateTotalDailyCalories(
    workouts: WorkoutData[],
    steps: number,
    userProfile: UserProfile
  ): number {
    // Calculate workout calories
    const workoutCalories = workouts.reduce((total, workout) => {
      return total + this.calculateWorkoutCalories(workout, userProfile);
    }, 0);

    // Calculate step calories
    const stepCalories = this.calculateStepCalories(steps, userProfile);

    return workoutCalories + stepCalories;
  }

  // Calculate workout intensity multiplier based on performance
  private static calculateIntensityMultiplier(totalReps: number, completedExercises: number): number {
    // Base multiplier
    let multiplier = 1.0;

    // High rep count increases calories
    if (totalReps > 200) {
      multiplier += 0.3;
    } else if (totalReps > 100) {
      multiplier += 0.15;
    } else if (totalReps > 50) {
      multiplier += 0.05;
    }

    // More exercises completed increases calories
    if (completedExercises > 10) {
      multiplier += 0.2;
    } else if (completedExercises > 6) {
      multiplier += 0.1;
    }

    return Math.min(multiplier, 1.8); // Cap at 180% of base
  }

  // Estimate calories burned from heart rate (when available)
  static calculateHeartRateCalories(
    avgHeartRate: number,
    duration_minutes: number,
    userProfile: UserProfile
  ): number {
    const { weight_lbs = 154, age = 30, gender = 'male' } = userProfile;
    
    // Convert to kg for calculation
    const weight_kg = weight_lbs * 0.453592;
    
    // Calculate max heart rate
    const maxHeartRate = 220 - age;
    const heartRateIntensity = avgHeartRate / maxHeartRate;
    
    // Base MET value based on heart rate intensity
    let metValue = 3.0; // Resting
    if (heartRateIntensity > 0.85) {
      metValue = 12.0; // Very high intensity
    } else if (heartRateIntensity > 0.7) {
      metValue = 8.0; // High intensity
    } else if (heartRateIntensity > 0.6) {
      metValue = 6.0; // Moderate intensity
    } else if (heartRateIntensity > 0.5) {
      metValue = 4.0; // Low intensity
    }

    const timeHours = duration_minutes / 60;
    let calories = metValue * weight_kg * timeHours;

    // Gender adjustment
    if (gender === 'male') {
      calories *= 1.1;
    }

    return Math.round(calories);
  }
}