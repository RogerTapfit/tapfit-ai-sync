import { useMemo } from "react";

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

interface MuscleGroupAnalysis {
  predominantGroup: string;
  distribution: Record<string, number>;
  workoutType: string;
  subtitle?: string;
}

export const useMuscleGroupAnalysis = (
  plannedWorkouts: WorkoutMachine[],
  extraExercises: WorkoutMachine[]
): MuscleGroupAnalysis => {
  return useMemo(() => {
    // Combine all exercises (planned + extra completed)
    const allExercises = [...plannedWorkouts, ...extraExercises];
    
    if (allExercises.length === 0) {
      return {
        predominantGroup: 'chest',
        distribution: {},
        workoutType: 'Mixed Workout',
        subtitle: 'No exercises recorded'
      };
    }

    // Count muscle groups
    const muscleGroupCounts = allExercises.reduce((acc, exercise) => {
      const group = exercise.muscleGroup;
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate percentages
    const total = allExercises.length;
    const distribution = Object.entries(muscleGroupCounts).reduce((acc, [group, count]) => {
      acc[group] = Math.round((count / total) * 100);
      return acc;
    }, {} as Record<string, number>);

    // Find predominant muscle group
    const sortedGroups = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a);
    
    const [predominantGroup, predominantPercentage] = sortedGroups[0] || ['chest', 0];

    // Determine workout type and subtitle based on distribution
    let workoutType: string;
    let subtitle: string | undefined;

    if (predominantPercentage >= 70) {
      // Single muscle group dominant
      workoutType = `${predominantGroup.charAt(0).toUpperCase() + predominantGroup.slice(1)} Day Workout`;
    } else if (predominantPercentage >= 50) {
      // Focused but not dominant
      workoutType = `${predominantGroup.charAt(0).toUpperCase() + predominantGroup.slice(1)}-Focused Workout`;
      
      // Show secondary muscle group if significant
      const secondaryGroups = sortedGroups.slice(1)
        .filter(([, percentage]) => percentage >= 20)
        .map(([group, percentage]) => `${percentage}% ${group}`)
        .slice(0, 2); // Limit to top 2 secondary groups
      
      if (secondaryGroups.length > 0) {
        subtitle = `${predominantPercentage}% ${predominantGroup}, ${secondaryGroups.join(', ')}`;
      }
    } else {
      // Mixed workout
      workoutType = 'Mixed Muscle Workout';
      
      // Show top 3 muscle groups for mixed workouts
      const topGroups = sortedGroups
        .slice(0, 3)
        .map(([group, percentage]) => `${percentage}% ${group}`)
        .join(', ');
      
      subtitle = topGroups;
    }

    return {
      predominantGroup,
      distribution,
      workoutType,
      subtitle
    };
  }, [plannedWorkouts, extraExercises]);
};