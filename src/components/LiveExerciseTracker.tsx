import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLiveExercise, type WorkoutStats } from '@/hooks/useLiveExercise';
import { type ExerciseType } from '@/utils/exerciseDetection';
import { drawPose } from '@/features/bodyScan/ml/poseVideo';
import { 
  Play, 
  Pause, 
  Square, 
  Dumbbell,
  Activity,
  Timer,
  Award,
  TrendingUp,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { useTapCoins } from '@/hooks/useTapCoins';
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger';
import { toast } from 'sonner';

const EXERCISES = [
  { id: 'pushups' as ExerciseType, name: 'Push-ups', icon: '💪', coins: 10 },
  { id: 'squats' as ExerciseType, name: 'Squats', icon: '🦵', coins: 10 },
  { id: 'lunges' as ExerciseType, name: 'Lunges', icon: '🏃', coins: 8 },
  { id: 'jumping_jacks' as ExerciseType, name: 'Jumping Jacks', icon: '⭐', coins: 8 },
  { id: 'high_knees' as ExerciseType, name: 'High Knees', icon: '🔥', coins: 12 },
];

interface LiveExerciseTrackerProps {
  preSelectedExercise?: ExerciseType;
  machineName?: string;
  onBackToMachine?: () => void;
}

export function LiveExerciseTracker({ 
  preSelectedExercise,
  machineName,
  onBackToMachine 
}: LiveExerciseTrackerProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>(preSelectedExercise || 'pushups');
  const [targetReps, setTargetReps] = useState(10);
  const [showResults, setShowResults] = useState(false);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [skipSetup, setSkipSetup] = useState(!!preSelectedExercise);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { awardCoins } = useTapCoins();
  const { startWorkout, logExercise, completeWorkout } = useWorkoutLogger();

  const handleComplete = async (stats: WorkoutStats) => {
    setWorkoutStats(stats);
    setShowResults(true);

    // Award coins based on performance
    const exercise = EXERCISES.find(e => e.id === selectedExercise);
    const baseCoins = exercise?.coins || 10;
    const bonusCoins = stats.avgFormScore >= 90 ? 5 : stats.avgFormScore >= 75 ? 2 : 0;
    const totalCoins = baseCoins + bonusCoins;

    try {
      await awardCoins(totalCoins, 'earn_workout', `Completed ${stats.reps} ${exercise?.name || 'reps'}`);
      
      // Log workout - create workout session and log exercise
      const workoutLog = await startWorkout(
        `${exercise?.name || selectedExercise} Session`,
        'Bodyweight',
        1
      );

      if (workoutLog) {
        await logExercise(
          workoutLog.id,
          exercise?.name || selectedExercise,
          undefined,
          1,
          stats.reps
        );
        await completeWorkout(workoutLog.id, Math.ceil(stats.duration / 60));
      }

      toast.success(`Earned ${totalCoins} TapCoins! 🎉`);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const {
    videoRef,
    isActive,
    isPaused,
    isPreviewMode,
    isInitialized,
    reps,
    targetReps: currentTarget,
    currentPhase,
    formScore,
    feedback,
    formIssues,
    duration,
    landmarks,
    progress,
    start,
    pause,
    resume,
    stop,
    startPreview,
    stopPreview
  } = useLiveExercise({
    exerciseType: selectedExercise,
    targetReps,
    onComplete: handleComplete
  });

  // Auto-start preview when initialized
  useEffect(() => {
    if (isInitialized && !isActive && !showResults && !skipSetup) {
      startPreview();
    }
    return () => {
      if (isPreviewMode) {
        stopPreview();
      }
    };
  }, [isInitialized, isActive, showResults, skipSetup]);

  // Draw pose overlay on canvas - continuously update (for both preview and active modes)
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    if (!isPreviewMode && !isActive) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Match canvas size to video
    const updateCanvasSize = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    updateCanvasSize();
    video.addEventListener('loadedmetadata', updateCanvasSize);

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
    };
  }, [isActive, isPreviewMode]);

  // Draw landmarks whenever they update
  useEffect(() => {
    if (!canvasRef.current || landmarks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !canvas.width || !canvas.height) return;

    drawPose(ctx, landmarks, canvas.width, canvas.height, formIssues);
  }, [landmarks, formIssues]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults && workoutStats) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold">Workout Complete!</h2>
          
          {machineName && (
            <Badge variant="secondary" className="mb-4">
              Warm-up for {machineName}
            </Badge>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{workoutStats.reps}</div>
              <div className="text-sm text-muted-foreground">Reps</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{formatTime(workoutStats.duration)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{workoutStats.avgFormScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Form</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{workoutStats.caloriesBurned}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </Card>
          </div>

          <div className="flex gap-4 justify-center">
            {onBackToMachine ? (
              <Button onClick={onBackToMachine} size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue to {machineName}
              </Button>
            ) : (
              <Button onClick={() => {
                setShowResults(false);
                setWorkoutStats(null);
                setSkipSetup(false);
              }}>
                <Dumbbell className="w-4 h-4 mr-2" />
                New Workout
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (!isActive) {
    // If pre-selected and initialized, start immediately
    if (skipSetup && isInitialized) {
      start();
      setSkipSetup(false);
    }

    return (
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <div className="text-center space-y-4">
            <Activity className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Live Exercise Tracker</h2>
            <p className="text-muted-foreground">
              Track your bodyweight exercises with real-time form feedback using AI
            </p>
            
            {machineName && (
              <Badge variant="secondary" className="mt-2">
                Warming up for {machineName}
              </Badge>
            )}
          </div>

          {/* Camera Preview during Setup */}
          {isPreviewMode && (
            <Card className="relative overflow-hidden bg-black">
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'normal' }}
                />
                
                {/* Preview Status Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {landmarks.length === 0 ? (
                    <div className="bg-black/70 px-6 py-4 rounded-lg space-y-2">
                      <Badge variant="secondary" className="text-lg px-6 py-3">
                        👤 Position yourself in frame
                      </Badge>
                      <p className="text-sm text-white/70 text-center">
                        Step back so your full body is visible
                      </p>
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4">
                      <Badge className="text-sm px-4 py-2 bg-green-500">
                        ✓ Ready to start
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {!preSelectedExercise && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Exercise</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {EXERCISES.map((exercise) => (
                    <Button
                      key={exercise.id}
                      variant={selectedExercise === exercise.id ? 'default' : 'outline'}
                      className="h-20 flex flex-col items-center justify-center gap-2"
                      onClick={() => setSelectedExercise(exercise.id)}
                    >
                      <span className="text-2xl">{exercise.icon}</span>
                      <span className="text-xs">{exercise.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.coins} coins
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Target Reps</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 30].map((count) => (
                  <Button
                    key={count}
                    variant={targetReps === count ? 'default' : 'outline'}
                    onClick={() => setTargetReps(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => {
                if (isPreviewMode) {
                  stopPreview();
                }
                start();
              }}
              size="lg" 
              className="w-full"
              disabled={!isInitialized}
            >
              <Play className="w-5 h-5 mr-2" />
              {isInitialized ? 'Start Workout' : 'Initializing AI...'}
            </Button>

            {!isInitialized && (
              <p className="text-sm text-muted-foreground text-center">
                Loading AI pose detection model...
              </p>
            )}
            
            {onBackToMachine && (
              <Button 
                onClick={onBackToMachine}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Skip to {machineName}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{reps}/{currentTarget}</div>
              <div className="text-xs text-muted-foreground">Reps</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{formatTime(duration)}</div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{formScore}%</div>
              <div className="text-xs text-muted-foreground">Form</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Badge 
            variant={currentPhase === 'down' ? 'default' : 'secondary'}
            className="w-full justify-center py-2"
          >
            {currentPhase === 'up' ? 'Up ↑' : currentPhase === 'down' ? 'Down ↓' : 'Moving'}
          </Badge>
        </Card>
      </div>

      {/* Video Feed */}
      <Card className="relative overflow-hidden bg-black">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'normal' }}
          />
          
          {/* Feedback Overlay */}
          <div className="absolute top-4 left-4 right-4 space-y-2">
            {feedback.map((msg, idx) => (
              <Badge 
                key={idx} 
                variant={msg.includes('Perfect') || msg.includes('Great') ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {msg}
              </Badge>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-4 left-4 right-4">
            <Progress value={progress} className="h-3" />
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex gap-4 justify-center">
        {!isPaused ? (
          <Button onClick={pause} size="lg" variant="secondary">
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </Button>
        ) : (
          <Button onClick={resume} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Resume
          </Button>
        )}
        
        <Button onClick={stop} size="lg" variant="destructive">
          <Square className="w-5 h-5 mr-2" />
          End Workout
        </Button>
      </div>
    </div>
  );
}
