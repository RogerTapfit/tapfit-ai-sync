import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flame, Snowflake, ThumbsUp } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  onSubmit: (rating: number) => void;
}

const difficultyLevels = [
  { rating: 1, label: 'Too Easy', icon: Snowflake, color: 'text-blue-400', bgColor: 'hover:bg-blue-500/20' },
  { rating: 2, label: 'Easy', icon: Snowflake, color: 'text-cyan-400', bgColor: 'hover:bg-cyan-500/20' },
  { rating: 3, label: 'Just Right', icon: ThumbsUp, color: 'text-green-400', bgColor: 'hover:bg-green-500/20' },
  { rating: 4, label: 'Challenging', icon: Flame, color: 'text-orange-400', bgColor: 'hover:bg-orange-500/20' },
  { rating: 5, label: 'Very Hard', icon: Flame, color: 'text-red-400', bgColor: 'hover:bg-red-500/20' },
];

export const DifficultyFeedbackModal: React.FC<Props> = ({
  open,
  onClose,
  exerciseName,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected);
      setSelected(null);
      onClose();
    }
  };

  const handleSkip = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            How hard is {exerciseName}?
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center mb-4">
          Your feedback helps us recommend better sets & reps
        </p>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {difficultyLevels.map(level => {
            const Icon = level.icon;
            const isSelected = selected === level.rating;
            return (
              <button
                key={level.rating}
                onClick={() => setSelected(level.rating)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                  ${isSelected 
                    ? `bg-primary/20 ring-2 ring-primary ${level.color}` 
                    : `${level.bgColor} text-muted-foreground`
                  }
                `}
              >
                <Icon className={`h-6 w-6 ${isSelected ? level.color : ''}`} />
                <span className="text-[10px] font-medium">{level.rating}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <p className="text-center text-sm font-medium mb-4">
            {difficultyLevels.find(l => l.rating === selected)?.label}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={handleSkip}>
            Skip
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSubmit}
            disabled={!selected}
          >
            Save Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
