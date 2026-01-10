import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, SkipForward, Pause, Play, ChevronRight, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutExercise {
  id: string;
  name: string;
  emoji: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  isHold?: boolean;
  instructions?: string;
}

interface StoredWorkout {
  name: string;
  exercises: WorkoutExercise[];
}

export const AtHomeWorkoutSession: React.FC = () => {
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<StoredWorkout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(30);
  const [holdTimeLeft, setHoldTimeLeft] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [workoutStartTime] = useState(Date.now());

  useEffect(() => {
    const stored = sessionStorage.getItem('atHomeWorkout');
    if (!stored) {
      toast.error('No workout found');
      navigate('/at-home-workout-builder');
      return;
    }
    setWorkout(JSON.parse(stored));
  }, [navigate]);

  // Rest timer
  useEffect(() => {
    if (!isResting || isPaused) return;
    if (restTimeLeft <= 0) {
      setIsResting(false);
      return;
    }
    const timer = setInterval(() => {
      setRestTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isResting, restTimeLeft, isPaused]);

  // Hold timer
  useEffect(() => {
    if (!isHolding || isPaused) return;
    if (holdTimeLeft <= 0) {
      completeSet();
      return;
    }
    const timer = setInterval(() => {
      setHoldTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isHolding, holdTimeLeft, isPaused]);

  const currentExercise = workout?.exercises[currentExerciseIndex];
  const totalExercises = workout?.exercises.length || 0;
  const overallProgress = ((currentExerciseIndex / totalExercises) * 100) + 
    ((currentSet / (currentExercise?.sets || 1)) * (100 / totalExercises));

  const startHold = useCallback(() => {
    if (!currentExercise?.holdSeconds) return;
    setHoldTimeLeft(currentExercise.holdSeconds);
    setIsHolding(true);
  }, [currentExercise]);

  const completeSet = useCallback(() => {
    if (!workout || !currentExercise) return;
    
    setIsHolding(false);
    
    if (currentSet < currentExercise.sets) {
      // More sets to do
      setCurrentSet(prev => prev + 1);
      setRestTimeLeft(30);
      setIsResting(true);
    } else {
      // Exercise complete
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      
      if (currentExerciseIndex < workout.exercises.length - 1) {
        // More exercises
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setRestTimeLeft(45); // Longer rest between exercises
        setIsResting(true);
      } else {
        // Workout complete!
        finishWorkout();
      }
    }
  }, [workout, currentExercise, currentSet, currentExerciseIndex]);

  const skipRest = () => {
    setIsResting(false);
    setRestTimeLeft(30);
  };

  const skipExercise = () => {
    if (!workout) return;
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setIsHolding(false);
      setIsResting(false);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    const duration = Math.round((Date.now() - workoutStartTime) / 1000 / 60);
    
    // Log to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user && workout) {
      try {
        const { data: workoutLog } = await supabase
          .from('workout_logs')
          .insert({
            user_id: user.id,
            workout_name: workout.name,
            workout_type: 'at_home',
            muscle_group: 'full_body',
            started_at: new Date(workoutStartTime).toISOString(),
            completed_at: new Date().toISOString(),
            total_exercises: completedExercises.length,
            notes: `At-home workout: ${workout.exercises.map(e => e.name).join(', ')}`
          })
          .select()
          .single();

        if (workoutLog) {
          for (const ex of workout.exercises) {
            if (completedExercises.includes(ex.id)) {
              await supabase.from('exercise_logs').insert({
                user_id: user.id,
                workout_log_id: workoutLog.id,
                exercise_name: ex.name,
                machine_name: 'Bodyweight',
                sets_completed: ex.sets,
                reps_completed: ex.isHold ? 1 : ex.reps,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error logging workout:', error);
      }
    }

    toast.success(`Workout complete! ${completedExercises.length} exercises in ${duration} min`);
    sessionStorage.removeItem('atHomeWorkout');
    navigate('/');
  };

  if (!workout || !currentExercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading workout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('End workout early?')) {
                  navigate('/');
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              End
            </Button>
            <p className="text-sm font-medium">{workout.name}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Rest Screen */}
        {isResting && (
          <Card className="p-8 text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <Timer className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Rest</h2>
            <p className="text-6xl font-mono font-bold text-blue-500 mb-4">
              {restTimeLeft}s
            </p>
            <p className="text-muted-foreground mb-6">
              Next: {currentSet < currentExercise.sets 
                ? `Set ${currentSet + 1} of ${currentExercise.name}` 
                : currentExerciseIndex < workout.exercises.length - 1 
                  ? workout.exercises[currentExerciseIndex + 1].name 
                  : 'Finish!'}
            </p>
            <Button onClick={skipRest} variant="outline">
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Rest
            </Button>
          </Card>
        )}

        {/* Active Exercise */}
        {!isResting && (
          <>
            <Card className="p-6 text-center">
              <span className="text-6xl mb-4 block">{currentExercise.emoji}</span>
              <h2 className="text-3xl font-bold mb-2">{currentExercise.name}</h2>
              <p className="text-xl text-muted-foreground mb-4">
                Set {currentSet} of {currentExercise.sets}
              </p>
              
              {currentExercise.isHold ? (
                // Hold Exercise
                <div className="space-y-4">
                  {isHolding ? (
                    <>
                      <p className="text-7xl font-mono font-bold text-primary">
                        {holdTimeLeft}s
                      </p>
                      <p className="text-lg text-muted-foreground">Hold it!</p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-bold">{currentExercise.holdSeconds}s hold</p>
                      <Button 
                        size="lg" 
                        className="w-full max-w-xs"
                        onClick={startHold}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Start Hold
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                // Rep Exercise
                <div className="space-y-4">
                  <p className="text-6xl font-bold text-primary">
                    {currentExercise.reps} reps
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full max-w-xs bg-gradient-to-r from-green-500 to-emerald-600"
                    onClick={completeSet}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Complete Set
                  </Button>
                </div>
              )}

              {currentExercise.instructions && (
                <p className="mt-6 text-sm text-muted-foreground border-t pt-4">
                  💡 {currentExercise.instructions}
                </p>
              )}
            </Card>

            {/* Skip Button */}
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={skipExercise}
            >
              Skip Exercise
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}

        {/* Exercise Queue */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Up Next</h3>
          <div className="space-y-2">
            {workout.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4).map((ex, i) => (
              <div 
                key={ex.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{ex.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets} sets × {ex.isHold ? `${ex.holdSeconds}s` : `${ex.reps} reps`}
                  </p>
                </div>
              </div>
            ))}
            {workout.exercises.length > currentExerciseIndex + 4 && (
              <p className="text-xs text-muted-foreground text-center">
                +{workout.exercises.length - currentExerciseIndex - 4} more exercises
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AtHomeWorkoutSession;
