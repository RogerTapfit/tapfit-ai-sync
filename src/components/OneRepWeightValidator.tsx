import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  const [sliderValue, setSliderValue] = useState([2]); // Default to "Just Right" (middle position)
  
  const machineImageUrl = getMachineImageUrl(exercise.machine);

  const handleStartRep = () => {
    setHasTriedRep(true);
    setShowFeedback(true);
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    
    const position = value[0];
    let newWeight = currentWeight;
    
    switch (position) {
      case 0: // Way Too Easy
        newWeight = currentWeight + 20;
        setCurrentWeight(newWeight);
        setShowFeedback(false);
        setHasTriedRep(false);
        break;
      case 1: // Too Light
        newWeight = currentWeight + 10;
        setCurrentWeight(newWeight);
        setShowFeedback(false);
        setHasTriedRep(false);
        break;
      case 2: // Just Right
        onWeightConfirmed(currentWeight);
        return;
      case 3: // Too Heavy
        newWeight = Math.max(10, currentWeight - 10);
        setCurrentWeight(newWeight);
        setShowFeedback(false);
        setHasTriedRep(false);
        break;
      case 4: // Way Too Heavy
        newWeight = Math.max(10, currentWeight - 20);
        setCurrentWeight(newWeight);
        setShowFeedback(false);
        setHasTriedRep(false);
        break;
    }
  };

  const getSliderLabels = () => [
    "Way Too Easy",
    "Too Light", 
    "Just Right",
    "Too Heavy",
    "Way Too Heavy"
  ];

  return (
    <Card className="max-w-lg mx-auto m-4">
      <CardHeader className="text-center px-4 py-6">
        <CardTitle className="text-lg sm:text-xl">{exercise.name}</CardTitle>
        <p className="text-muted-foreground text-sm">Try one rep to find your perfect weight</p>
      </CardHeader>
      
      <CardContent className="space-y-6 px-4 pb-6">
        {/* Machine Image */}
        <div className="flex justify-center">
          <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-xl bg-white/5 overflow-hidden">
            <img 
              src={machineImageUrl} 
              alt={exercise.machine}
              className="w-full h-full object-contain p-2"
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
              <Button onClick={handleStartRep} className="flex-1 h-16 text-lg font-semibold" size="lg">
                <Play className="h-5 w-5 mr-2" />
                Did One Rep
              </Button>
              <Button onClick={onSkip} variant="outline" size="lg" className="sm:w-auto h-16">
                Skip
              </Button>
            </div>
          </div>
        ) : showFeedback ? (
          <div className="space-y-6">
            <p className="text-center text-sm text-muted-foreground px-2">
              How did that feel?
            </p>
            
            <div className="space-y-4">
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={0}
                max={4}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                {getSliderLabels().map((label, index) => (
                  <span 
                    key={index} 
                    className={`text-center flex-1 ${sliderValue[0] === index ? 'text-primary font-medium' : ''}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                {sliderValue[0] === 0 && "Adding 20 lbs"}
                {sliderValue[0] === 1 && "Adding 10 lbs"}
                {sliderValue[0] === 2 && "Perfect! Confirming weight"}
                {sliderValue[0] === 3 && "Reducing 10 lbs"}
                {sliderValue[0] === 4 && "Reducing 20 lbs"}
              </div>
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