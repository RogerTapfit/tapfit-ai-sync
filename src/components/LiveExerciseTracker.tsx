import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLiveExercise, type WorkoutStats } from '@/hooks/useLiveExercise';
import { type ExerciseType } from '@/utils/exerciseDetection';
import { drawPose, drawIdealPose } from '@/features/bodyScan/ml/poseVideo';
import { cn } from '@/lib/utils';
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
  ArrowLeft,
  SwitchCamera,
  AlertTriangle,
  Lightbulb,
  Mic,
  MicOff,
  Gauge,
  Zap,
  Eye,
  EyeOff,
  Target,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Video,
  StopCircle,
  Download,
  Share2
} from 'lucide-react';
import { useTapCoins } from '@/hooks/useTapCoins';
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { toast } from 'sonner';
import { shareVideo, saveVideoLocally } from '@/utils/shareVideo';

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
  const [isMirrored, setIsMirrored] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { awardCoins } = useTapCoins();
  const { startWorkout: logWorkoutStart, logExercise, completeWorkout: logWorkoutComplete } = useWorkoutLogger();

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
      const workoutLog = await logWorkoutStart(
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
        await logWorkoutComplete(workoutLog.id, Math.ceil(stats.duration / 60));
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
    isReadyForAutoStart,
    readyCountdown,
    reps,
    targetReps: currentTarget,
    currentPhase,
    formScore,
    feedback,
    formIssues,
    duration,
    landmarks,
    progress,
    facingMode,
    distanceStatus,
    poseConfidence,
    repSpeed,
    lastRepDuration,
    showIdealPose,
    idealPoseLandmarks,
    toggleIdealPose,
    alignmentScore,
    misalignedJoints,
    concentricVelocity,
    eccentricVelocity,
    concentricZone,
    eccentricZone,
    isResting,
    restTimer,
    restDuration,
    currentSet,
    currentElbowAngle,
    upBaseline,
    upThreshold,
    downThreshold,
    bottomAchieved,
    minAngleInRep,
    isRepFlashing,
    isSpeaking,
    isVoiceEnabled,
    toggleVoice,
    isRecording,
    recordedChunks,
    startRecording,
    stopRecording,
    downloadRecording,
    updateRestDuration,
    skipRest,
    completeWorkout,
    start,
    pause,
    resume,
    stop,
    startPreview,
    stopPreview,
    switchCamera
  } = useLiveExercise({
    exerciseType: selectedExercise,
    targetReps,
    onComplete: handleComplete
  });

  // Voice commands integration
  const {
    isListening: isVoiceActive,
    isSupported: isVoiceSupported,
    toggleListening: toggleVoiceCommands
  } = useVoiceCommands({
    isTTSSpeaking: isSpeaking,
    onStart: () => {
      if (!isActive && isInitialized) {
        start();
      }
    },
    onPause: () => {
      if (isActive && !isPaused) {
        pause();
      }
    },
    onResume: () => {
      if (isActive && isPaused) {
        resume();
      }
    },
    onStop: () => {
      if (isActive) {
        stop();
      }
    }
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

    // Match canvas size to video's displayed dimensions with device pixel ratio
    const updateCanvasSize = () => {
      const rect = video.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width && rect.height) {
        // CSS size stays in CSS pixels
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        // Internal bitmap scaled for crisp rendering
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
    };

    updateCanvasSize();
    video.addEventListener('loadedmetadata', updateCanvasSize);
    window.addEventListener('orientationchange', updateCanvasSize);

    // Add resize observer to update canvas when video display size changes
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(video);

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, [isActive, isPreviewMode]);

  // Draw landmarks whenever they update with proper scaling for object-fit: cover
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    // Clear entire canvas in device pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Source (intrinsic) video size
    const srcW = video.videoWidth || cssW;
    const srcH = video.videoHeight || cssH;

    // object-cover math: scale to fill and center
    const scale = Math.max(cssW / srcW, cssH / srcH);
    const dx = (cssW - srcW * scale) / 2;
    const dy = (cssH - srcH * scale) / 2;

    // Apply DPR and mapping transform (in CSS px)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(dx, dy);
    ctx.scale(scale, scale);

    // Draw ideal pose if enabled (using source dimensions)
    if (showIdealPose && idealPoseLandmarks.length > 0) {
      drawIdealPose(ctx, idealPoseLandmarks, srcW, srcH);
    }

    // Draw current pose (using source dimensions)
    if (landmarks.length > 0) {
      drawPose(ctx, landmarks, srcW, srcH, formIssues, misalignedJoints, isRepFlashing);
    }
  }, [landmarks, formIssues, showIdealPose, idealPoseLandmarks, misalignedJoints, isRepFlashing]);

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
              <div className="text-2xl font-bold text-primary">{workoutStats.sets}</div>
              <div className="text-sm text-muted-foreground">Sets</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{workoutStats.reps}</div>
              <div className="text-sm text-muted-foreground">Last Set Reps</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{formatTime(workoutStats.duration)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{workoutStats.avgFormScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Form</div>
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
            <Card className="relative overflow-hidden bg-black max-w-2xl mx-auto">
              <div className="relative aspect-[9/16] bg-black">
                <video
                  ref={videoRef}
                  className={cn("w-full h-full object-cover", isMirrored && "scale-x-[-1]")}
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'normal' }}
                />
                

                {/* Control Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                  <Button
                    onClick={switchCamera}
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
                    title="Switch Camera"
                  >
                    <SwitchCamera className="w-5 h-5 text-white" />
                  </Button>
                  
                  <Button
                    onClick={() => setIsMirrored(!isMirrored)}
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
                    title={isMirrored ? "Disable Mirror" : "Enable Mirror"}
                  >
                    <FlipHorizontal className={cn("w-5 h-5 text-white", isMirrored && "text-primary")} />
                  </Button>
                  
                  {/* Ideal Pose Toggle */}
                  <Button
                    onClick={toggleIdealPose}
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
                    title={showIdealPose ? "Hide Guide" : "Show Guide"}
                  >
                    {showIdealPose ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-white" />}
                  </Button>
                </div>

                {/* Auto-Start Countdown Overlay */}
                {isReadyForAutoStart && readyCountdown !== null && readyCountdown > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                    <div className="text-center space-y-4">
                      <Badge variant="outline" className="text-lg px-6 py-2 bg-primary/20 border-primary">
                        GET READY
                      </Badge>
                      <div
                        key={readyCountdown}
                        className="text-9xl font-bold text-primary animate-scale-in"
                      >
                        {readyCountdown}
                      </div>
                    </div>
                  </div>
                )}

                {/* GO! Animation */}
                {isReadyForAutoStart && readyCountdown === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm z-50">
                    <div className="text-9xl font-bold text-primary animate-scale-in">
                      GO!
                    </div>
                  </div>
                )}

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
              <label className="text-sm font-medium mb-2 block">Target Reps per Set</label>
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

            {/* Voice Commands Toggle */}
            {isVoiceSupported && (
              <>
                <Button
                  onClick={toggleVoiceCommands}
                  variant={isVoiceActive ? 'default' : 'outline'}
                  size="lg"
                  className="w-full"
                >
                  {isVoiceActive ? (
                    <>
                      <Mic className="w-5 h-5 mr-2 animate-pulse" />
                      Voice Commands Active
                    </>
                  ) : (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Enable Voice Commands
                    </>
                  )}
                </Button>
                
                {isVoiceActive && (
                  <Card className="p-4 bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Available Voice Commands
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Badge variant="secondary">"Start workout"</Badge>
                      <Badge variant="secondary">"Pause"</Badge>
                      <Badge variant="secondary">"Resume"</Badge>
                      <Badge variant="secondary">"Stop"</Badge>
                    </div>
                  </Card>
                )}
              </>
            )}

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

        <Card className={cn(
          "p-4 transition-all",
          repSpeed === 'too-fast' && "bg-orange-500/10 border-orange-500",
          repSpeed === 'too-slow' && "bg-blue-500/10 border-blue-500",
          repSpeed === 'perfect' && "bg-green-500/10 border-green-500"
        )}>
          <div className="flex items-center gap-2">
            <Gauge className={cn(
              "w-5 h-5",
              repSpeed === 'too-fast' && "text-orange-500",
              repSpeed === 'too-slow' && "text-blue-500",
              repSpeed === 'perfect' && "text-green-500",
              !repSpeed && "text-primary"
            )} />
            <div>
              <div className={cn(
                "text-2xl font-bold",
                repSpeed === 'too-fast' && "text-orange-500",
                repSpeed === 'too-slow' && "text-blue-500",
                repSpeed === 'perfect' && "text-green-500"
              )}>
                {lastRepDuration > 0 ? `${(lastRepDuration / 1000).toFixed(1)}s` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">Rep Tempo</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Angle Feedback for Pushups */}
      {selectedExercise === 'pushups' && isActive && (
        <>
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Elbow Angle</span>
                </div>
                <div className={cn(
                  "text-2xl font-bold tabular-nums",
                  currentElbowAngle > 0 && currentElbowAngle < 105 && "text-green-500",
                  currentElbowAngle >= 105 && currentElbowAngle < 115 && "text-yellow-500",
                  currentElbowAngle >= 150 && "text-green-500",
                  currentElbowAngle >= 140 && currentElbowAngle < 150 && "text-yellow-500"
                )}>
                  {currentElbowAngle > 0 ? `${Math.round(currentElbowAngle)}°` : '--'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={cn(
                  "p-2 rounded border-2 transition-all",
                  currentElbowAngle > 0 && currentElbowAngle < 105 ? "bg-green-500/20 border-green-500" :
                  currentElbowAngle >= 105 && currentElbowAngle < 115 ? "bg-yellow-500/20 border-yellow-400" :
                  "bg-muted border-muted"
                )}>
                  <div className="font-semibold">Down Position</div>
                  <div className="text-muted-foreground">Target: &lt;105°</div>
                </div>
                
                <div className={cn(
                  "p-2 rounded border-2 transition-all",
                  currentElbowAngle >= 150 ? "bg-green-500/20 border-green-500" :
                  currentElbowAngle >= 140 && currentElbowAngle < 150 ? "bg-yellow-500/20 border-yellow-400" :
                  "bg-muted border-muted"
                )}>
                  <div className="font-semibold">Up Position</div>
                  <div className="text-muted-foreground">Target: &gt;150°</div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  {currentElbowAngle > 0 && currentElbowAngle < 105 && "✓ Great depth!"}
                  {currentElbowAngle >= 105 && currentElbowAngle < 115 && "Almost there - go a bit lower"}
                  {currentElbowAngle >= 150 && "✓ Fully extended!"}
                  {currentElbowAngle >= 140 && currentElbowAngle < 150 && "Almost there - extend arms fully"}
                  {currentElbowAngle >= 115 && currentElbowAngle < 140 && "In transition"}
                  {currentElbowAngle === 0 && "Start your first rep"}
                </span>
              </div>
            </div>
          </Card>

          {/* Debug Panel for Push-ups */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">Rep Counter Debug</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                >
                  {showDebugPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {showDebugPanel && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Calibration Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Calibration Status</span>
                      {upBaseline !== null ? (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50">
                          ✓ Calibrated
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50">
                          ⚠ Not Calibrated
                        </Badge>
                      )}
                    </div>
                    
                    {upBaseline === null && (
                      <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded text-xs">
                        <div className="font-semibold text-orange-700 dark:text-orange-400">Get into plank position to calibrate</div>
                        <div className="text-muted-foreground mt-1">Keep your arms straight (150°+) and hold steady for 1 second</div>
                      </div>
                    )}
                  </div>

                  {/* Thresholds */}
                  {upBaseline !== null && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-muted-foreground">Baseline</div>
                        <div className="text-lg font-bold">{Math.round(upBaseline)}°</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-muted-foreground">Up Threshold</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{Math.round(upThreshold)}°</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-muted-foreground">Down Threshold</div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(downThreshold)}°</div>
                      </div>
                    </div>
                  )}

                  {/* Rep Tracking Status */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Rep Tracking</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={cn(
                        "p-2 rounded border-2",
                        bottomAchieved 
                          ? "bg-green-500/20 border-green-500/50" 
                          : "bg-muted border-muted"
                      )}>
                        <div className="font-semibold">Bottom Achieved</div>
                        <div className="text-lg">{bottomAchieved ? "✓ Yes" : "✗ No"}</div>
                      </div>
                      
                      <div className="p-2 bg-muted/50 rounded border">
                        <div className="font-semibold">Min Angle</div>
                        <div className="text-lg font-bold">
                          {minAngleInRep !== Infinity ? `${Math.round(minAngleInRep)}°` : '--'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why Reps Aren't Counting */}
                  <div className="p-3 bg-muted/30 rounded border">
                    <div className="text-sm font-semibold mb-2">Rep Counter Status</div>
                    <div className="text-xs space-y-1">
                      {upBaseline === null && (
                        <div className="flex items-start gap-2 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Not calibrated - get in plank position (arms straight)</span>
                        </div>
                      )}
                      
                      {upBaseline !== null && !bottomAchieved && currentPhase !== 'up' && (
                        <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Bottom not reached - go lower to {Math.round(downThreshold)}° or below</span>
                        </div>
                      )}
                      
                      {upBaseline !== null && bottomAchieved && currentPhase !== 'up' && (
                        <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
                          <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Push back up to {Math.round(upThreshold)}°+ to count rep</span>
                        </div>
                      )}
                      
                      {upBaseline !== null && currentPhase === 'up' && currentElbowAngle >= upThreshold && (
                        <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                          <Activity className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>✓ Ready to count next rep! Go down to start.</span>
                        </div>
                      )}
                      
                      {poseConfidence < 60 && (
                        <div className="flex items-start gap-2 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Low confidence ({Math.round(poseConfidence)}%) - adjust your position in frame</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Video Feed */}
      <Card className={cn(
        "relative overflow-hidden bg-black transition-all duration-300",
        // Phase indicator border colors
        currentPhase === 'up' && "ring-4 ring-green-500/50",
        currentPhase === 'down' && "ring-4 ring-blue-500/50",
        currentPhase === 'transition' && "ring-4 ring-yellow-500/50"
      )}>
        <div className="relative aspect-[9/16] bg-black max-w-2xl mx-auto">
          <video
            ref={videoRef}
            className={cn("w-full h-full object-cover", isMirrored && "scale-x-[-1]")}
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'normal' }}
          />
          
          {/* Phase Position Indicator */}
          <div className="absolute right-4 top-20 z-30 pointer-events-none">
            <Badge className={cn(
              "text-base px-4 py-2 font-bold backdrop-blur-md border-2 shadow-2xl transition-all duration-200",
              currentPhase === 'up' && "bg-green-500/90 border-green-400 text-white scale-110",
              currentPhase === 'down' && "bg-blue-500/90 border-blue-400 text-white scale-110",
              currentPhase === 'transition' && "bg-yellow-500/50 border-yellow-400 text-white scale-95"
            )}>
              {currentPhase === 'up' && '↑ UP'}
              {currentPhase === 'down' && '↓ DOWN'}
              {currentPhase === 'transition' && '⟷'}
            </Badge>
          </div>
          
          {/* Debug Badge for Push-ups - Shows angle, baseline, and thresholds */}
          {selectedExercise === 'pushups' && isActive && currentElbowAngle > 0 && (
            <div className="absolute left-4 top-20 z-30 pointer-events-none">
              <Badge className="text-xs px-3 py-2 backdrop-blur-md bg-black/70 border border-white/30 text-white font-mono space-y-0.5">
                <div className="font-bold text-sm">Angle: {Math.round(currentElbowAngle)}°</div>
                <div className="text-[10px] opacity-80 space-y-0.5">
                  <div>State: {currentPhase.toUpperCase()}</div>
                  <div>Confidence: {Math.round(poseConfidence)}%</div>
                </div>
              </Badge>
            </div>
          )}
          
          {/* Animated Rep Counter - Right Side Display */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
            <div className="flex flex-col items-center gap-2">
              <div 
                key={reps} // Key forces re-render on rep change
                className={cn(
                  "text-8xl font-black leading-none tabular-nums transition-all",
                  "animate-scale-in",
                  isRepFlashing ? "text-green-400" : 
                  formScore >= 90 ? "text-green-400" : 
                  formScore >= 75 ? "text-yellow-400" : 
                  "text-orange-400",
                  "drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                )}
                style={{
                  textShadow: isRepFlashing 
                    ? '0 0 50px rgba(34, 197, 94, 1), 0 0 30px rgba(34, 197, 94, 0.8)' 
                    : '0 0 40px rgba(0,0,0,0.9), 0 0 20px currentColor',
                  animation: 'scale-in 0.3s ease-out',
                  transform: isRepFlashing ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.3s ease-out'
                }}
              >
                {reps}
              </div>
              <div className="text-sm text-white/80 font-semibold">
                / {currentTarget}
              </div>
            </div>
          </div>
          
          {/* Camera Controls */}
          <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto z-20">
            {/* Recording Button */}
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="icon"
                variant="secondary"
                className="rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
                title="Start Recording"
              >
                <Video className="w-4 h-4 text-white" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="icon"
                variant="secondary"
                className="rounded-full w-10 h-10 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm border border-red-400/50 animate-pulse"
                title="Stop Recording"
              >
                <StopCircle className="w-4 h-4 text-white" />
              </Button>
            )}
            
            <Button
              onClick={switchCamera}
              size="icon"
              variant="secondary"
              className="rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
              title="Switch Camera"
            >
              <SwitchCamera className="w-4 h-4 text-white" />
            </Button>
            
            <Button
              onClick={() => setIsMirrored(!isMirrored)}
              size="icon"
              variant="secondary"
              className="rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
              title={isMirrored ? "Disable Mirror" : "Enable Mirror"}
            >
              <FlipHorizontal className={cn("w-4 h-4 text-white", isMirrored && "text-primary")} />
            </Button>
            
            {/* Ideal Pose Toggle */}
            <Button
              onClick={toggleIdealPose}
              size="icon"
              variant="secondary"
              className="rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
              title={showIdealPose ? "Hide Guide" : "Show Guide"}
            >
              {showIdealPose ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
            </Button>
            
            {/* Coach Voice Toggle */}
            <Button
              onClick={() => {
                toggleVoice();
                // Show feedback toast
                if (isVoiceEnabled) {
                  toast.info('Coach voice turned off', { duration: 2000 });
                } else {
                  toast.success('Coach voice turned on', { duration: 2000 });
                }
              }}
              size="icon"
              variant="secondary"
              className="rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
              title={isVoiceEnabled ? "Turn Off Coach Voice" : "Turn On Coach Voice"}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
            </Button>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <Badge className="bg-red-500/90 text-white backdrop-blur-sm px-3 py-1.5 text-sm animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full mr-2 inline-block" />
                Recording
              </Badge>
            </div>
          )}

          {/* Guide Info Banner */}
          {showIdealPose && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <Badge className="bg-blue-500/90 text-white backdrop-blur-sm px-3 py-1.5 text-xs">
                <Eye className="h-3 w-3 mr-1.5" />
                Match the blue guide
              </Badge>
            </div>
          )}
          
          {/* Rest Timer Overlay */}
          {isResting && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <Card className="bg-background/95 backdrop-blur-md border-2 border-primary shadow-2xl max-w-md mx-4">
                <div className="p-8 text-center space-y-6">
                  <div className="text-6xl mb-4">😌</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Rest Time</h3>
                    <p className="text-muted-foreground">Completed Set {currentSet}</p>
                  </div>
                  
                  <div className="relative">
                    <div className="text-7xl font-bold text-primary tabular-nums">
                      {restTimer}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">seconds remaining</div>
                  </div>

                  <Progress 
                    value={((restDuration - restTimer) / restDuration) * 100} 
                    className="h-3"
                  />

                  <div className="flex gap-3">
                    <Button 
                      onClick={skipRest}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      Skip Rest
                    </Button>
                    <Button 
                      onClick={completeWorkout}
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Workout
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Feedback Overlay */}
          <div className="absolute top-4 left-4 right-4 space-y-2 z-10">
            {/* Active Tracking Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="text-sm px-3 py-1 bg-green-500/90 backdrop-blur-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                Rep Tracking Active
              </Badge>
              
              {/* Set Counter */}
              {currentSet > 0 && (
                <Badge className="text-sm px-3 py-1 bg-primary/90 backdrop-blur-sm text-primary-foreground font-semibold">
                  <Award className="w-3 h-3 mr-1" />
                  Set {currentSet}
                </Badge>
              )}
              
              {/* Alignment Score */}
              {showIdealPose && alignmentScore > 0 && (
                <Badge 
                  className={cn(
                    "text-sm px-3 py-1 backdrop-blur-sm font-semibold",
                    alignmentScore >= 80 && "bg-green-500/90 text-white",
                    alignmentScore >= 60 && alignmentScore < 80 && "bg-yellow-500/90 text-white",
                    alignmentScore < 60 && "bg-red-500/90 text-white"
                  )}
                >
                  <Target className="w-3 h-3 mr-1" />
                  {alignmentScore}% Aligned
                </Badge>
              )}
              
              {/* Velocity Tracking */}
              {(concentricZone || eccentricZone) && (
                <>
                  {/* Concentric (Up) Velocity */}
                  {concentricVelocity > 0 && concentricZone && (
                    <Badge 
                      className={cn(
                        "text-xs px-2.5 py-1 backdrop-blur-sm font-semibold",
                        concentricZone === 'explosive' && "bg-purple-500/90 text-white",
                        concentricZone === 'moderate' && "bg-green-500/90 text-white",
                        concentricZone === 'slow' && "bg-blue-500/90 text-white"
                      )}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      ↑ {(concentricVelocity / 1000).toFixed(2)}s
                      <span className="ml-1 opacity-75 text-[10px]">
                        ({concentricZone === 'explosive' ? 'Explosive' : concentricZone === 'moderate' ? 'Moderate' : 'Controlled'})
                      </span>
                    </Badge>
                  )}
                  
                  {/* Eccentric (Down) Velocity */}
                  {eccentricVelocity > 0 && eccentricZone && (
                    <Badge 
                      className={cn(
                        "text-xs px-2.5 py-1 backdrop-blur-sm font-semibold",
                        eccentricZone === 'explosive' && "bg-purple-500/90 text-white",
                        eccentricZone === 'moderate' && "bg-green-500/90 text-white",
                        eccentricZone === 'slow' && "bg-blue-500/90 text-white"
                      )}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      ↓ {(eccentricVelocity / 1000).toFixed(2)}s
                      <span className="ml-1 opacity-75 text-[10px]">
                        ({eccentricZone === 'explosive' ? 'Explosive' : eccentricZone === 'moderate' ? 'Moderate' : 'Controlled'})
                      </span>
                    </Badge>
                  )}
                </>
              )}
              
              {/* Voice Command Status */}
              {isVoiceActive && (
                <Badge 
                  variant="default"
                  className="text-sm px-3 py-1 bg-blue-500/90 backdrop-blur-sm animate-pulse"
                >
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Active
                </Badge>
              )}
            </div>
            
            {/* Rep Speed Warning */}
            {repSpeed && repSpeed !== 'perfect' && (
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-lg backdrop-blur-md border-2 shadow-lg animate-in fade-in slide-in-from-top-2",
                repSpeed === 'too-fast' && "bg-orange-500/20 border-orange-400",
                repSpeed === 'too-slow' && "bg-blue-500/20 border-blue-400"
              )}>
                <div className={cn(
                  "p-2 rounded-full",
                  repSpeed === 'too-fast' && "bg-orange-500",
                  repSpeed === 'too-slow' && "bg-blue-500"
                )}>
                  {repSpeed === 'too-fast' ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : (
                    <Gauge className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "font-bold text-lg",
                    repSpeed === 'too-fast' && "text-orange-400",
                    repSpeed === 'too-slow' && "text-blue-400"
                  )}>
                    {repSpeed === 'too-fast' ? 'Too Fast - Slow Down!' : 'Too Slow - Speed Up!'}
                  </div>
                  <div className="text-sm text-white/90">
                    {repSpeed === 'too-fast' 
                      ? 'Control your movement for maximum muscle engagement and safety'
                      : 'Maintain momentum for better workout effectiveness'
                    }
                  </div>
                </div>
              </div>
            )}
            
            {feedback.map((msg, idx) => (
              <Badge 
                key={idx} 
                variant={msg.includes('Perfect') || msg.includes('Great') ? 'default' : 'secondary'}
                className="text-sm px-3 py-1 backdrop-blur-sm"
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
      <div className="flex gap-4 justify-center flex-wrap">
        {!isPaused ? (
          <Button onClick={pause} size="lg" variant="secondary">
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </Button>
        ) : (
          <>
            <Button onClick={resume} size="lg" className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
            <Button onClick={completeWorkout} variant="secondary" size="lg">
              <Square className="w-4 h-4 mr-2" />
              End Workout
            </Button>
          </>
        )}
        
        {isVoiceSupported && (
          <Button 
            onClick={toggleVoiceCommands}
            size="lg"
            variant={isVoiceActive ? 'default' : 'outline'}
          >
            {isVoiceActive ? (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Voice On
              </>
            ) : (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Voice Off
              </>
            )}
          </Button>
        )}
        
        <Button onClick={stop} size="lg" variant="destructive">
          <Square className="w-5 h-5 mr-2" />
          End Workout
        </Button>
      </div>
      
      {/* Recorded Video Options */}
      {recordedChunks.length > 0 && !isRecording && (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-background border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Workout Recorded!</h3>
              <p className="text-sm text-muted-foreground">
                Save your workout video or share it with friends
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={() => saveVideoLocally(recordedChunks)}
              variant="default"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Locally
            </Button>
            <Button 
              onClick={() => shareVideo(recordedChunks)}
              variant="secondary"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
