import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, TrendingUp, TrendingDown, Play } from 'lucide-react';

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
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{exercise.name}</CardTitle>
        <p className="text-muted-foreground">Try one rep to find your perfect weight</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">
            {currentWeight} lbs
          </div>
          <Badge variant="outline">
            {exercise.sets} sets × {exercise.reps} reps
          </Badge>
        </div>

        {!hasTriedRep ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Load {currentWeight} lbs and try one rep with proper form
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleStartRep} className="flex-1" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Did One Rep
              </Button>
              <Button onClick={onSkip} variant="outline" size="lg">
                Skip
              </Button>
            </div>
          </div>
        ) : showFeedback ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
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
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            We'll adjust automatically during your workouts
          </p>
        </div>
      </CardContent>
    </Card>
  );
};