import { useState } from 'react';
import { useExerciseImage } from '@/hooks/useExerciseImages';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';

interface ExerciseFormImageProps {
  exerciseId: string;
  exerciseName: string;
  emoji: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showModal?: boolean;
}

export function ExerciseFormImage({ 
  exerciseId, 
  exerciseName, 
  emoji, 
  size = 'md',
  showModal = true 
}: ExerciseFormImageProps) {
  const { image, loading } = useExerciseImage(exerciseId);
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-full max-w-xs',
    hero: 'w-full'
  };

  const isLargeSize = size === 'xl' || size === 'hero';

  const hasImage = image?.image_url && image.generation_status === 'complete';

  const ImageContent = () => (
    <div 
      className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : hasImage ? (
        <img 
          src={isLargeSize ? image.image_url : (image.mini_image_url || image.image_url)} 
          alt={exerciseName}
          className={`w-full h-full ${isLargeSize ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <span className={size === 'sm' ? 'text-lg' : size === 'hero' || size === 'xl' ? 'text-6xl' : 'text-2xl'}>{emoji}</span>
      )}
    </div>
  );

  if (!showModal || !hasImage) {
    return <ImageContent />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="relative group">
          <ImageContent />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{emoji}</span>
            {exerciseName} - Form Guide
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <img 
            src={image.image_url} 
            alt={`${exerciseName} form guide`}
            className="w-full rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
