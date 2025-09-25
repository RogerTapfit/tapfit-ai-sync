import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  ArrowRight,
  Dumbbell,
  Heart
} from 'lucide-react';

export interface CalibrationExercise {
  id: string;
  name: string;
  machine: string;
  muscle_group: string;
  category: 'strength' | 'endurance';
  instructions: string;
  target_reps?: number;
  target_duration?: number; // For endurance tests
  baseline_weight?: number;
}

export interface CalibrationResult {
  exercise_id: string;
  exercise_name: string;
  machine: string;
  muscle_group: string;
  weight_used?: number;
  reps_completed: number;
  duration_seconds?: number;
  perceived_exertion: number; // 1-10 scale
  form_quality: number; // 1-10 scale
  notes?: string;
}

interface CalibrationDayWorkoutProps {
  onComplete: (results: CalibrationResult[]) => void;
  onSkip?: () => void;
}

const CALIBRATION_EXERCISES: CalibrationExercise[] = [
  // Strength Tests
  {
    id: 'chest_press_test',
    name: 'Chest Press Max Test',
    machine: 'Chest Press Machine',
    muscle_group: 'chest',
    category: 'strength',
    instructions: 'Start with light weight. Gradually increase until you can only complete 8-10 reps with good form.',
    target_reps: 10,
    baseline_weight: 20
  },
  {
    id: 'leg_press_test',
    name: 'Leg Press Strength Test',
    machine: 'Leg Press Machine',
    muscle_group: 'legs',
    category: 'strength',
    instructions: 'Find your 12-rep maximum with proper form. Focus on full range of motion.',
    target_reps: 12,
    baseline_weight: 40
  },
  {
    id: 'lat_pulldown_test',
    name: 'Lat Pulldown Assessment',
    machine: 'Lat Pulldown Machine',
    muscle_group: 'back',
    category: 'strength',
    instructions: 'Pull to upper chest with control. Find weight for clean 10 reps.',
    target_reps: 10,
    baseline_weight: 25
  },
  {
    id: 'shoulder_press_test',
    name: 'Shoulder Press Evaluation',
    machine: 'Shoulder Press Machine',
    muscle_group: 'shoulders',
    category: 'strength',
    instructions: 'Press overhead with stable core. Find your 8-rep maximum.',
    target_reps: 8,
    baseline_weight: 15
  },
  
  // Endurance Tests
  {
    id: 'cardio_endurance_test',
    name: '12-Minute Cardio Test',
    machine: 'Treadmill',
    muscle_group: 'cardiovascular',
    category: 'endurance',
    instructions: 'Maintain steady pace for 12 minutes. Track distance and heart rate.',
    target_duration: 720 // 12 minutes in seconds
  },
  {
    id: 'plank_core_test',
    name: 'Plank Hold Test',
    machine: 'Bodyweight',
    muscle_group: 'core',
    category: 'endurance',
    instructions: 'Hold plank position with perfect form as long as possible.',
    target_duration: 120 // 2 minutes target
  }
];

export const CalibrationDayWorkout: React.FC<CalibrationDayWorkoutProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [results, setResults] = useState<CalibrationResult[]>([]);
  const [currentResult, setCurrentResult] = useState<Partial<CalibrationResult>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentExercise = CALIBRATION_EXERCISES[currentExerciseIndex];
  const progressPercentage = ((currentExerciseIndex + 1) / CALIBRATION_EXERCISES.length) * 100;

  const startRestPeriod = () => {
    setIsResting(true);
    setRestTimeLeft(90); // 90 seconds rest between exercises
    
    const timer = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const recordExerciseResult = () => {
    const result: CalibrationResult = {
      exercise_id: currentExercise.id,
      exercise_name: currentExercise.name,
      machine: currentExercise.machine,
      muscle_group: currentExercise.muscle_group,
      weight_used: currentResult.weight_used,
      reps_completed: currentResult.reps_completed || 0,
      duration_seconds: currentResult.duration_seconds,
      perceived_exertion: currentResult.perceived_exertion || 5,
      form_quality: currentResult.form_quality || 8,
      notes: currentResult.notes
    };

    const updatedResults = [...results, result];
    setResults(updatedResults);
    setCurrentResult({});

    if (currentExerciseIndex < CALIBRATION_EXERCISES.length - 1) {
      startRestPeriod();
      setTimeout(() => {
        setCurrentExerciseIndex(prev => prev + 1);
      }, 90000); // Move to next exercise after rest
    } else {
      completeCalibration(updatedResults);
    }
  };

  const completeCalibration = async (finalResults: CalibrationResult[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Calculate baseline metrics from results
      const strengthMetrics = finalResults
        .filter(r => CALIBRATION_EXERCISES.find(e => e.id === r.exercise_id)?.category === 'strength')
        .reduce((acc, r) => {
          acc[r.muscle_group] = {
            max_weight: r.weight_used || 0,
            reps_at_weight: r.reps_completed,
            form_score: r.form_quality,
            exertion_level: r.perceived_exertion
          };
          return acc;
        }, {} as any);

      const enduranceMetrics = finalResults
        .filter(r => CALIBRATION_EXERCISES.find(e => e.id === r.exercise_id)?.category === 'endurance')
        .reduce((acc, r) => {
          acc[r.muscle_group] = {
            duration_seconds: r.duration_seconds || 0,
            reps_completed: r.reps_completed,
            form_score: r.form_quality,
            exertion_level: r.perceived_exertion
          };
          return acc;
        }, {} as any);

      // Calculate fitness assessment
      const avgFormScore = finalResults.reduce((sum, r) => sum + r.form_quality, 0) / finalResults.length;
      const avgExertion = finalResults.reduce((sum, r) => sum + r.perceived_exertion, 0) / finalResults.length;
      
      let fitnessLevel = 'beginner';
      if (avgFormScore >= 8 && avgExertion <= 7) fitnessLevel = 'intermediate';
      if (avgFormScore >= 9 && avgExertion <= 6) fitnessLevel = 'advanced';

      // Save calibration results
      const { error } = await supabase
        .from('user_calibration_results')
        .upsert({
          user_id: user.id,
          calibration_date: new Date().toISOString().split('T')[0],
          strength_metrics: strengthMetrics,
          endurance_metrics: enduranceMetrics,
          baseline_weights: finalResults.reduce((acc, r) => {
            if (r.weight_used) {
              acc[`${r.machine}_${r.exercise_name}`.toLowerCase().replace(/\s+/g, '_')] = r.weight_used;
            }
            return acc;
          }, {} as any),
          fitness_assessment: fitnessLevel,
          recommendations: generateRecommendations(finalResults, fitnessLevel),
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsCompleted(true);
      toast.success('Calibration completed! Your personalized workout plan is ready.');
      setTimeout(() => onComplete(finalResults), 2000);
    } catch (error) {
      console.error('Error saving calibration results:', error);
      toast.error('Failed to save calibration results');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (results: CalibrationResult[], fitnessLevel: string) => {
    const recommendations = [];
    
    // Analyze form quality
    const poorFormExercises = results.filter(r => r.form_quality < 7);
    if (poorFormExercises.length > 0) {
      recommendations.push({
        category: 'form_improvement',
        message: `Focus on form improvement for: ${poorFormExercises.map(e => e.muscle_group).join(', ')}`,
        priority: 'high'
      });
    }

    // Analyze strength imbalances
    const strengthResults = results.filter(r => 
      CALIBRATION_EXERCISES.find(e => e.id === r.exercise_id)?.category === 'strength'
    );
    
    if (strengthResults.length > 0) {
      const avgWeight = strengthResults.reduce((sum, r) => sum + (r.weight_used || 0), 0) / strengthResults.length;
      const weakAreas = strengthResults.filter(r => (r.weight_used || 0) < avgWeight * 0.8);
      
      if (weakAreas.length > 0) {
        recommendations.push({
          category: 'strength_balance',
          message: `Strengthen weak areas: ${weakAreas.map(e => e.muscle_group).join(', ')}`,
          priority: 'medium'
        });
      }
    }

    // Fitness level specific recommendations
    switch (fitnessLevel) {
      case 'beginner':
        recommendations.push({
          category: 'progression',
          message: 'Start with 2-3 workouts per week, focus on learning proper form',
          priority: 'high'
        });
        break;
      case 'intermediate':
        recommendations.push({
          category: 'progression',
          message: 'Ready for 3-4 workouts per week with progressive overload',
          priority: 'medium'
        });
        break;
      case 'advanced':
        recommendations.push({
          category: 'progression',
          message: 'Can handle 4-5 workouts per week with advanced techniques',
          priority: 'low'
        });
        break;
    }

    return recommendations;
  };

  if (isCompleted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Calibration Complete!</CardTitle>
          <p className="text-muted-foreground">
            Your fitness baseline has been established. We're now creating your personalized workout plan.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={100} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{results.length}</div>
                <div className="text-muted-foreground">Tests Completed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {Math.round(results.reduce((sum, r) => sum + r.form_quality, 0) / results.length)}
                </div>
                <div className="text-muted-foreground">Avg Form Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isResting) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Rest Period</CardTitle>
          <p className="text-muted-foreground">
            Take a breather before the next exercise
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground">
            Stay hydrated and prepare for: <strong>{CALIBRATION_EXERCISES[currentExerciseIndex + 1]?.name}</strong>
          </p>
          <Progress value={(90 - restTimeLeft) / 90 * 100} className="mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Calibration Day - Exercise {currentExerciseIndex + 1} of {CALIBRATION_EXERCISES.length}
              </CardTitle>
              <p className="text-muted-foreground">
                Establishing your baseline fitness metrics for personalized training
              </p>
            </div>
            <Badge variant="outline">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
      </Card>

      {/* Current Exercise */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentExercise.name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {currentExercise.muscle_group}
              </Badge>
              <Badge variant="outline">
                {currentExercise.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Machine: {currentExercise.machine}
              </h4>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Instructions:</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentExercise.instructions}
              </p>
            </div>

            {currentExercise.target_reps && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Target:</span>
                  {currentExercise.target_reps} reps
                </div>
              </div>
            )}

            {currentExercise.target_duration && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Target:</span>
                  {Math.floor(currentExercise.target_duration / 60)} minutes
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Recording */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Record Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExercise.category === 'strength' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight Used (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder={`Start with ${currentExercise.baseline_weight}kg`}
                    value={currentResult.weight_used || ''}
                    onChange={(e) => setCurrentResult(prev => ({ 
                      ...prev, 
                      weight_used: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps Completed</Label>
                  <Input
                    id="reps"
                    type="number"
                    placeholder="Number of reps"
                    value={currentResult.reps_completed || ''}
                    onChange={(e) => setCurrentResult(prev => ({ 
                      ...prev, 
                      reps_completed: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </>
            )}

            {currentExercise.category === 'endurance' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="How long did you last?"
                    value={currentResult.duration_seconds || ''}
                    onChange={(e) => setCurrentResult(prev => ({ 
                      ...prev, 
                      duration_seconds: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="exertion">Perceived Exertion (1-10)</Label>
              <Input
                id="exertion"
                type="number"
                min="1"
                max="10"
                placeholder="How hard was it? (1=very easy, 10=maximum effort)"
                value={currentResult.perceived_exertion || ''}
                onChange={(e) => setCurrentResult(prev => ({ 
                  ...prev, 
                  perceived_exertion: parseInt(e.target.value) || 5 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form">Form Quality (1-10)</Label>
              <Input
                id="form"
                type="number"
                min="1"
                max="10"
                placeholder="How was your form? (1=poor, 10=perfect)"
                value={currentResult.form_quality || ''}
                onChange={(e) => setCurrentResult(prev => ({ 
                  ...prev, 
                  form_quality: parseInt(e.target.value) || 8 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any observations or challenges?"
                value={currentResult.notes || ''}
                onChange={(e) => setCurrentResult(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={recordExerciseResult}
                disabled={!currentResult.reps_completed && !currentResult.duration_seconds}
                className="flex-1"
              >
                {currentExerciseIndex < CALIBRATION_EXERCISES.length - 1 ? (
                  <>
                    Record & Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete Calibration <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{result.exercise_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.muscle_group}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {result.weight_used && (
                      <span>{result.weight_used}kg</span>
                    )}
                    {result.reps_completed > 0 && (
                      <span>{result.reps_completed} reps</span>
                    )}
                    {result.duration_seconds && (
                      <span>{Math.floor(result.duration_seconds / 60)}:{(result.duration_seconds % 60).toString().padStart(2, '0')}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {result.perceived_exertion}/10
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip Option */}
      {onSkip && (
        <div className="text-center">
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Skip Calibration (Use Default Settings)
          </Button>
        </div>
      )}
    </div>
  );
};

export default CalibrationDayWorkout;