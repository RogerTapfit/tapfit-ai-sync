import { useMemo } from 'react';
import { AtHomeExercise, atHomeExercises, exerciseCategories } from '@/data/atHomeExercises';

interface SelectedExercise extends AtHomeExercise {
  sets: number;
  reps: number;
  holdSeconds?: number;
  difficultyRating?: number; // 1-5 user rating
}

interface MuscleGroupBalance {
  categoryId: string;
  categoryName: string;
  emoji: string;
  count: number;
  percentage: number;
  isUnderworked: boolean;
  isOverworked: boolean;
}

interface WorkoutRecommendation {
  type: 'add_exercise' | 'increase_reps' | 'increase_sets' | 'balance_workout';
  message: string;
  exercise?: AtHomeExercise;
  category?: string;
  priority: 'high' | 'medium' | 'low';
}

export const useWorkoutRecommendations = (selectedExercises: SelectedExercise[]) => {
  // Analyze muscle group balance
  const muscleGroupBalance = useMemo((): MuscleGroupBalance[] => {
    if (selectedExercises.length === 0) return [];

    const categoryCounts: Record<string, number> = {};
    selectedExercises.forEach(ex => {
      categoryCounts[ex.category] = (categoryCounts[ex.category] || 0) + 1;
    });

    const total = selectedExercises.length;
    const idealPercentage = 100 / exerciseCategories.length;

    return exerciseCategories.map(cat => {
      const count = categoryCounts[cat.id] || 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        emoji: cat.emoji,
        count,
        percentage,
        isUnderworked: count === 0 && total >= 3,
        isOverworked: percentage > 50 && total >= 3,
      };
    });
  }, [selectedExercises]);

  // Get complementary exercise suggestions
  const getComplementaryExercises = useMemo(() => {
    if (selectedExercises.length === 0) return [];

    const selectedIds = new Set(selectedExercises.map(e => e.id));
    const categoryCounts: Record<string, number> = {};
    selectedExercises.forEach(ex => {
      categoryCounts[ex.category] = (categoryCounts[ex.category] || 0) + 1;
    });

    // Find underworked categories
    const underworkedCategories = exerciseCategories
      .filter(cat => !categoryCounts[cat.id] || categoryCounts[cat.id] === 0)
      .map(cat => cat.id);

    // Get exercises from underworked categories, prioritizing beginner-friendly
    const suggestions = atHomeExercises
      .filter(ex => 
        !selectedIds.has(ex.id) && 
        underworkedCategories.includes(ex.category)
      )
      .sort((a, b) => {
        // Prioritize beginner exercises
        const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      })
      .slice(0, 3);

    return suggestions;
  }, [selectedExercises]);

  // Generate smart recommendations based on workout composition
  const recommendations = useMemo((): WorkoutRecommendation[] => {
    const recs: WorkoutRecommendation[] = [];
    
    if (selectedExercises.length === 0) return recs;

    // Check for muscle imbalances
    const underworked = muscleGroupBalance.filter(m => m.isUnderworked);
    const overworked = muscleGroupBalance.filter(m => m.isOverworked);

    // Suggest balance if overworked
    if (overworked.length > 0) {
      recs.push({
        type: 'balance_workout',
        message: `Your workout is heavy on ${overworked.map(m => m.categoryName).join(', ')}. Consider adding variety!`,
        category: overworked[0].categoryId,
        priority: 'medium',
      });
    }

    // Suggest exercises from underworked categories
    underworked.forEach(cat => {
      const suggestion = atHomeExercises.find(
        ex => ex.category === cat.categoryId && 
        !selectedExercises.some(s => s.id === ex.id) &&
        ex.difficulty === 'beginner'
      );
      if (suggestion) {
        recs.push({
          type: 'add_exercise',
          message: `Add ${cat.categoryName} work`,
          exercise: suggestion,
          category: cat.categoryId,
          priority: 'high',
        });
      }
    });

    // Check for difficulty-based progression suggestions
    selectedExercises.forEach(ex => {
      if (ex.difficultyRating) {
        if (ex.difficultyRating <= 2) {
          // Too easy - suggest more reps/sets
          recs.push({
            type: 'increase_reps',
            message: `"${ex.name}" seems easy! Try +3 reps or +1 set`,
            exercise: ex,
            priority: 'medium',
          });
        } else if (ex.difficultyRating >= 4) {
          // Hard - suggest rest or fewer reps
          recs.push({
            type: 'increase_sets',
            message: `"${ex.name}" is challenging. Great for building strength!`,
            exercise: ex,
            priority: 'low',
          });
        }
      }
    });

    return recs.slice(0, 4); // Limit to 4 recommendations
  }, [selectedExercises, muscleGroupBalance]);

  // Generate progression suggestions based on difficulty ratings
  const getProgressionSuggestion = (
    exercise: SelectedExercise, 
    rating: number
  ): { sets?: number; reps?: number; holdSeconds?: number; message: string } => {
    if (rating <= 2) {
      // Too easy
      if (exercise.isHold) {
        return {
          holdSeconds: (exercise.holdSeconds || 30) + 10,
          message: 'Try holding 10 seconds longer!',
        };
      } else {
        const addReps = rating === 1 ? 5 : 3;
        return {
          reps: exercise.reps + addReps,
          message: `Bump it up to ${exercise.reps + addReps} reps!`,
        };
      }
    } else if (rating >= 4) {
      // Challenging
      return {
        sets: exercise.sets + 1,
        message: rating === 5 
          ? 'Keep this intensity and add a set next time!'
          : 'Great challenge! Stay consistent.',
      };
    }
    
    return { message: 'Perfect difficulty level!' };
  };

  return {
    muscleGroupBalance,
    recommendations,
    getComplementaryExercises,
    getProgressionSuggestion,
  };
};
