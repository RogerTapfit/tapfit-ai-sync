import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, TrendingUp, TrendingDown, Play } from 'lucide-react';
import { getMachineImageUrl } from '@/utils/machineImageUtils';

interface ExerciseRecommendation {
  id: string;
  name: string;
  machine: string;
  muscle_group: string;
  recommended_weight: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  confidence: 'high' | 'medium' | 'learning';
}

interface OneRepWeightValidatorProps {
  exercise: ExerciseRecommendation;
  onWeightConfirmed: (finalWeight: number) => void;
  onSkip: () => void;
}

export const OneRepWeightValidator: React.FC<OneRepWeightValidatorProps> = ({
  exercise,
  onWeightConfirmed,
  onSkip
}) => {
  const [currentWeight, setCurrentWeight] = useState(exercise.recommended_weight);
  const [hasTriedRep, setHasTriedRep] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const machineImageUrl = getMachineImageUrl(exercise.machine);

  const handleStartRep = () => {
    setHasTriedRep(true);
    setShowFeedback(true);
  };

  const handleFeedback = (feedback: 'too_light' | 'perfect' | 'too_heavy') => {
    let newWeight = currentWeight;

    switch (feedback) {
      case 'too_light':
        newWeight = currentWeight + 10;
        setCurrentWeight(newWeight);
        setShowFeedback(false);
        setHasTriedRep(false);
        break;
      case 'too_heavy':
        newWeight = Math.max(10, currentWeight - 10);
        setCurrentWeight(newWeight);
        setShowFeedback(false);
        setHasTriedRep(false);
        break;
      case 'perfect':
        onWeightConfirmed(currentWeight);
        return;
    }
  };

  return (
    <Card className="max-w-lg mx-auto m-4">
      <CardHeader className="text-center px-4 py-6">
        <CardTitle className="text-lg sm:text-xl">{exercise.name}</CardTitle>
        <p className="text-muted-foreground text-sm">Try one rep to find your perfect weight</p>
      </CardHeader>
      
      <CardContent className="space-y-6 px-4 pb-6">
        {/* Machine Image */}
        <div className="flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted/30 overflow-hidden shadow-md">
            <img 
              src={machineImageUrl} 
              alt={exercise.machine}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
            {currentWeight} lbs
          </div>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {exercise.sets} sets × {exercise.reps} reps
          </Badge>
        </div>

        {!hasTriedRep ? (
          <div className="space-y-4">
            <div className="text-center space-y-2 px-2">
              <p className="text-sm text-muted-foreground">
                Load {currentWeight} lbs and try one rep with proper form
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleStartRep} className="flex-1" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Did One Rep
              </Button>
              <Button onClick={onSkip} variant="outline" size="lg" className="sm:w-auto">
                Skip
              </Button>
            </div>
          </div>
        ) : showFeedback ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground px-2">
              How did that feel?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleFeedback('too_light')} 
                variant="outline" 
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Too Light (+10 lbs)
              </Button>
              
              <Button 
                onClick={() => handleFeedback('perfect')} 
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Perfect Weight
              </Button>
              
              <Button 
                onClick={() => handleFeedback('too_heavy')} 
                variant="outline" 
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                <TrendingDown className="h-4 w-4" />
                Too Heavy (-10 lbs)
              </Button>
            </div>
          </div>
        ) : null}
        
        <div className="text-center px-2">
          <p className="text-xs text-muted-foreground">
            We'll adjust automatically during your workouts
          </p>
        </div>
      </CardContent>
    </Card>
  );
};