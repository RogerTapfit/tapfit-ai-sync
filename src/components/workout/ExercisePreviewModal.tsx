import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Target } from 'lucide-react';
import { AtHomeExercise } from '@/data/atHomeExercises';
import { ExerciseFormImage } from './ExerciseFormImage';

interface ExercisePreviewModalProps {
  exercise: AtHomeExercise | null;
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: AtHomeExercise) => void;
  isAdded: boolean;
}

export const ExercisePreviewModal: React.FC<ExercisePreviewModalProps> = ({
  exercise,
  open,
  onClose,
  onAdd,
  isAdded,
}) => {
  if (!exercise) return null;

  const handleAdd = () => {
    onAdd(exercise);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{exercise.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Large Exercise Image */}
          <div className="flex justify-center">
            <ExerciseFormImage
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              emoji={exercise.emoji}
              size="hero"
              showModal={false}
            />
          </div>

          {/* Exercise Details */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {exercise.difficulty}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {exercise.isHold 
                ? `${exercise.defaultHoldSeconds}s hold` 
                : `${exercise.defaultReps} reps`
              }
            </Badge>
          </div>

          {/* Instructions */}
          {exercise.instructions && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">How to Perform</p>
              <p className="text-sm">{exercise.instructions}</p>
            </div>
          )}

          {/* Default Configuration */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Recommended: <span className="font-medium text-foreground">
                {exercise.defaultSets} sets × {exercise.isHold 
                  ? `${exercise.defaultHoldSeconds}s hold` 
                  : `${exercise.defaultReps} reps`
                }
              </span>
            </p>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAdd}
            disabled={isAdded}
            className="w-full"
            variant={isAdded ? "secondary" : "default"}
          >
            {isAdded ? (
              'Already Added'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Workout
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
