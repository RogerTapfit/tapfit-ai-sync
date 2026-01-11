import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Plus, TrendingUp, Scale, Sparkles } from 'lucide-react';
import { AtHomeExercise } from '@/data/atHomeExercises';

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

interface Props {
  recommendations: WorkoutRecommendation[];
  complementaryExercises: AtHomeExercise[];
  muscleGroupBalance: MuscleGroupBalance[];
  onAddExercise: (exercise: AtHomeExercise) => void;
  selectedCount: number;
}

export const WorkoutRecommendationsPanel: React.FC<Props> = ({
  recommendations,
  complementaryExercises,
  muscleGroupBalance,
  onAddExercise,
  selectedCount,
}) => {
  if (selectedCount === 0) {
    return null;
  }

  const activeCategories = muscleGroupBalance.filter(m => m.count > 0);
  const hasRecommendations = recommendations.length > 0 || complementaryExercises.length > 0;

  if (!hasRecommendations && activeCategories.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Smart Recommendations</h3>
      </div>

      {/* Muscle Balance Overview */}
      {activeCategories.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Scale className="h-3 w-3" />
            Muscle Balance
          </p>
          <div className="flex flex-wrap gap-1">
            {activeCategories.map(cat => (
              <Badge 
                key={cat.categoryId}
                variant={cat.isOverworked ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {cat.emoji} {cat.count}
              </Badge>
            ))}
            {muscleGroupBalance.filter(m => m.isUnderworked).slice(0, 2).map(cat => (
              <Badge 
                key={cat.categoryId}
                variant="outline"
                className="text-xs opacity-50"
              >
                {cat.emoji} 0
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 mb-4">
          {recommendations.slice(0, 2).map((rec, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                rec.priority === 'high' 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/50'
              }`}
            >
              {rec.type === 'add_exercise' && <Plus className="h-4 w-4 text-primary flex-shrink-0" />}
              {rec.type === 'increase_reps' && <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />}
              {rec.type === 'balance_workout' && <Scale className="h-4 w-4 text-amber-500 flex-shrink-0" />}
              <span className="flex-1 text-muted-foreground">{rec.message}</span>
              {rec.exercise && rec.type === 'add_exercise' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => onAddExercise(rec.exercise!)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Complementary Exercises */}
      {complementaryExercises.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Try adding these to balance your workout:
          </p>
          <div className="flex flex-wrap gap-2">
            {complementaryExercises.map(ex => (
              <Button
                key={ex.id}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onAddExercise(ex)}
              >
                {ex.emoji} {ex.name}
                <Plus className="h-3 w-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
