import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  CheckCircle, 
  Lightbulb,
  Dumbbell,
  TrendingUp,
  Target,
  Brain,
  Sparkles
} from 'lucide-react';
import { calculateOptimalWeight, calculateSetsAndReps, UserWeightProfile } from '@/services/weightCalculationService';
import { OneRepWeightValidator } from './OneRepWeightValidator';

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
  validation_feedback?: 'too_light' | 'just_right' | 'too_heavy';
}

interface SmartWeightRecommendationProps {
  userProfile: UserWeightProfile;
  onComplete: (recommendations: ExerciseRecommendation[]) => void;
}

const KEY_EXERCISES = [
  { id: 'chest_press', name: 'Chest Press', machine: 'Chest Press Machine', muscle_group: 'chest' },
  { id: 'leg_press', name: 'Leg Press', machine: 'Leg Press Machine', muscle_group: 'legs' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', machine: 'Lat Pulldown Machine', muscle_group: 'back' },
  { id: 'shoulder_press', name: 'Shoulder Press', machine: 'Shoulder Press Machine', muscle_group: 'shoulders' },
  { id: 'seated_row', name: 'Seated Row', machine: 'Seated Row Machine', muscle_group: 'back' },
  { id: 'leg_curl', name: 'Leg Curl', machine: 'Leg Curl Machine', muscle_group: 'legs' }
];

export const SmartWeightRecommendation: React.FC<SmartWeightRecommendationProps> = ({
  userProfile,
  onComplete
}) => {
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [currentValidationIndex, setCurrentValidationIndex] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationMode, setValidationMode] = useState<'quick' | 'one_rep'>('one_rep');

  // Generate initial recommendations
  useEffect(() => {
    const generateRecommendations = () => {
      const recs: ExerciseRecommendation[] = KEY_EXERCISES.map(exercise => {
        const weight = calculateOptimalWeight(userProfile, exercise.name, exercise.machine);
        const { sets, reps, rest_seconds } = calculateSetsAndReps(
          userProfile.primary_goal,
          userProfile.experience_level
        );

        // Determine confidence based on user profile completeness
        let confidence: 'high' | 'medium' | 'learning' = 'learning';
        if (userProfile.current_max_weights && Object.keys(userProfile.current_max_weights).length > 0) {
          confidence = 'high';
        } else if (userProfile.experience_level !== 'beginner') {
          confidence = 'medium';
        }

        return {
          id: exercise.id,
          name: exercise.name,
          machine: exercise.machine,
          muscle_group: exercise.muscle_group,
          recommended_weight: weight,
          sets,
          reps,
          rest_seconds,
          confidence
        };
      });

      setRecommendations(recs);
    };

    generateRecommendations();
  }, [userProfile]);

  const startOneRepValidation = () => {
    setValidationMode('one_rep');
    setShowValidation(true);
    setCurrentValidationIndex(0);
  };

  const startQuickValidation = () => {
    setValidationMode('quick');
    setShowValidation(true);
    setCurrentValidationIndex(0);
  };

  const handleWeightConfirmed = (finalWeight: number) => {
    const updatedRecs = [...recommendations];
    updatedRecs[currentValidationIndex] = {
      ...updatedRecs[currentValidationIndex],
      recommended_weight: finalWeight,
      confidence: 'high'
    };
    setRecommendations(updatedRecs);

    // Move to next exercise or complete
    if (currentValidationIndex < Math.min(2, recommendations.length - 1)) {
      setCurrentValidationIndex(currentValidationIndex + 1);
    } else {
      setShowValidation(false);
      completeRecommendations();
    }
  };

  const skipCurrentExercise = () => {
    if (currentValidationIndex < Math.min(2, recommendations.length - 1)) {
      setCurrentValidationIndex(currentValidationIndex + 1);
    } else {
      setShowValidation(false);
      completeRecommendations();
    }
  };

  const handleValidationFeedback = (feedback: 'too_light' | 'just_right' | 'too_heavy') => {
    const currentRec = recommendations[currentValidationIndex];
    let weightAdjustment = 0;

    // Adjust weight based on feedback
    switch (feedback) {
      case 'too_light':
        weightAdjustment = 10; // Add 10 lbs
        break;
      case 'too_heavy':
        weightAdjustment = -10; // Subtract 10 lbs
        break;
      case 'just_right':
        weightAdjustment = 0;
        break;
    }

    // Update the recommendation
    const updatedRecs = [...recommendations];
    updatedRecs[currentValidationIndex] = {
      ...currentRec,
      recommended_weight: Math.max(5, currentRec.recommended_weight + weightAdjustment),
      validation_feedback: feedback,
      confidence: feedback === 'just_right' ? 'high' : 'medium'
    };
    setRecommendations(updatedRecs);

    // Move to next exercise or complete
    if (currentValidationIndex < 2) { // Only validate first 3 exercises
      setCurrentValidationIndex(currentValidationIndex + 1);
    } else {
      setShowValidation(false);
      completeRecommendations();
    }
  };

  const completeRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save recommendations to user's calibration results
      const baseline_weights = recommendations.reduce((acc, rec) => {
        acc[`${rec.machine}_${rec.name}`.toLowerCase().replace(/\s+/g, '_')] = rec.recommended_weight;
        return acc;
      }, {} as Record<string, number>);

      const strength_metrics = recommendations.reduce((acc, rec) => {
        acc[rec.muscle_group] = {
          recommended_weight: rec.recommended_weight,
          sets: rec.sets,
          reps: rec.reps,
          confidence: rec.confidence,
          validation_feedback: rec.validation_feedback
        };
        return acc;
      }, {} as any);

      // Save to database
      const { error } = await supabase
        .from('user_calibration_results')
        .upsert({
          user_id: user.id,
          calibration_date: new Date().toISOString().split('T')[0],
          strength_metrics,
          endurance_metrics: {},
          baseline_weights,
          fitness_assessment: userProfile.experience_level,
          recommendations: generateSmartRecommendations(),
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsComplete(true);
      toast.success('Smart recommendations generated! You\'re ready to start working out.');
      setTimeout(() => onComplete(recommendations), 2000);
    } catch (error) {
      console.error('Error saving recommendations:', error);
      toast.error('Failed to save recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateSmartRecommendations = () => {
    return [
      {
        category: 'getting_started',
        message: 'Weights calculated based on your profile. Start with these and adjust as needed.',
        priority: 'high'
      },
      {
        category: 'progression',
        message: 'We\'ll automatically adjust your weights based on your performance.',
        priority: 'medium'
      },
      {
        category: 'safety',
        message: 'Always prioritize proper form over heavy weight.',
        priority: 'high'
      }
    ];
  };

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Smart Setup Complete!</CardTitle>
          <p className="text-muted-foreground">
            Your personalized weights have been calculated and you're ready to start training.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={100} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{recommendations.length}</div>
                <div className="text-muted-foreground">Exercises Configured</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">2 min</div>
                <div className="text-muted-foreground">Setup Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showValidation) {
    if (validationMode === 'one_rep') {
      const currentRec = recommendations[currentValidationIndex];
      return (
        <OneRepWeightValidator
          exercise={currentRec}
          onWeightConfirmed={handleWeightConfirmed}
          onSkip={skipCurrentExercise}
        />
      );
    }
    
    // Keep existing quick validation as fallback
    const currentRec = recommendations[currentValidationIndex];
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Quick Validation - {currentRec?.name}</CardTitle>
          <p className="text-muted-foreground">
            Validation {currentValidationIndex + 1} of 3 - Does this weight feel right for you?
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {currentRec?.recommended_weight} lbs
            </div>
            <Badge variant="outline" className="mb-4">
              {currentRec?.sets} sets × {currentRec?.reps} reps
            </Badge>
            <p className="text-sm text-muted-foreground">
              Based on your {userProfile.experience_level} level and {userProfile.primary_goal} goal
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleValidationFeedback('too_light')}
              className="h-16 flex flex-col"
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              Too Light
            </Button>
            <Button 
              variant="default" 
              onClick={() => handleValidationFeedback('just_right')}
              className="h-16 flex flex-col"
            >
              <CheckCircle className="h-5 w-5 mb-1" />
              Just Right
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleValidationFeedback('too_heavy')}
              className="h-16 flex flex-col"
            >
              <Dumbbell className="h-5 w-5 mb-1" />
              Too Heavy
            </Button>
          </div>

          <Progress value={((currentValidationIndex + 1) / 3) * 100} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Header */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Brain className="h-5 w-5 text-primary" />
                Smart Weight Recommendations
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                AI-calculated starting weights based on your profile
              </p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-center">
              <Lightbulb className="h-4 w-4 mr-1" />
              Intelligent Setup
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-0">
        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm sm:text-base">{rec.name}</h3>
                <Badge 
                  variant={rec.confidence === 'high' ? 'default' : rec.confidence === 'medium' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {rec.confidence === 'high' ? 'High' : 
                   rec.confidence === 'medium' ? 'Medium' : 'Learning'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Weight:</span>
                  <span className="font-semibold">{rec.recommended_weight} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sets × Reps:</span>
                  <span>{rec.sets} × {rec.reps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rest:</span>
                  <span>{Math.floor(rec.rest_seconds / 60)}m {rec.rest_seconds % 60}s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Ready to get started?</h3>
              <p className="text-sm text-muted-foreground px-2">
                Try one rep of each exercise to perfectly tune your weights, or start immediately
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={startOneRepValidation} 
                variant="default" 
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                <span className="sm:hidden">One-Rep Tuning</span>
                <span className="hidden sm:inline">One-Rep Tuning (Recommended)</span>
              </Button>
              <Button 
                onClick={() => completeRecommendations()} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                Start Working Out Now
              </Button>
            </div>
            
            <Button 
              onClick={startQuickValidation} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground"
            >
              Quick validation instead
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Don't worry - we'll adjust weights automatically based on your performance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};