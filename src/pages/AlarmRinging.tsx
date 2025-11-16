import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFitnessAlarm } from '@/hooks/useFitnessAlarm';
import { useLiveExercise } from '@/hooks/useLiveExercise';
import { useAlarmAudio } from '@/hooks/useAlarmAudio';
import { alarmStorageService } from '@/services/alarmStorageService';
import { Play, SwitchCamera, FlipHorizontal, Volume2, VolumeX, Activity, Pause } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';
import { drawPose, type Keypoint } from '@/features/bodyScan/ml/poseVideo';
import { toast } from 'sonner';

export default function AlarmRinging() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alarms, logCompletion } = useFitnessAlarm();
  const [alarm, setAlarm] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isAlarmMuted, setIsAlarmMuted] = useState(false);
  const completedRef = useRef(false);
  const hasAutoStartedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualCrossingRef = useRef<{ below: boolean; initialized: boolean }>({ below: false, initialized: false });

  const { play: playAlarm, stop: stopAlarm } = useAlarmAudio(alarm?.alarm_sound || 'classic');

  async function handleComplete() {
    if (completedRef.current || !alarm || !startTime) return;
    completedRef.current = true;

    const timeToComplete = Math.floor((Date.now() - startTime) / 1000);

    try {
      await logCompletion({
        alarm_id: alarm.id,
        push_ups_completed: reps,
        time_to_complete: timeToComplete,
      });

      // Stop alarm
      stopAlarm();
      
      // Clear ringing alarm
      alarmStorageService.clearRingingAlarm();
      
      // Success haptics
      await Haptics.impact({ style: ImpactStyle.Heavy });
      
      // Navigate back
      setTimeout(() => {
        navigate('/fitness-alarm');
      }, 2000);
    } catch (error) {
      console.error('Failed to log completion:', error);
    }
  }

  const {
    videoRef,
    reps,
    landmarks,
    formScore,
    formIssues,
    misalignedJoints,
    start: startExercise,
    isActive,
    isInitialized,
    currentPhase,
    isPaused,
    pause,
    resume,
    isVoiceEnabled,
    toggleVoice,
    stop: stopWorkout,
    progress,
    currentYPosition,
    positionRange,
    repState,
    downThreshold,
    upThreshold,
    duration,
    lastRepDuration,
    repSpeed,
    switchCamera,
    isRepFlashing,
    isPreviewMode,
    startPreview,
    countRepNow,
  } = useLiveExercise({
    exerciseType: 'pushups',
    targetReps: alarm?.push_up_count ?? 10,
    onComplete: handleComplete,
  });

  // Local state for mirror since useLiveExercise doesn't provide it on alarm page
  const [isMirrored, setIsMirrored] = useState(true);
  const toggleMirror = () => setIsMirrored(!isMirrored);

  // Camera permission helpers
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Load alarm data
  useEffect(() => {
    if (id && alarms) {
      const foundAlarm = alarms.find(a => a.id === id);
      setAlarm(foundAlarm);
    }
  }, [id, alarms]);

  // Auto-start preview if camera permission already granted
  useEffect(() => {
    if (!isInitialized || isActive || isPreviewMode) return;
    
    (async () => {
      try {
        const anyNav: any = navigator as any;
        if (anyNav?.permissions?.query) {
          const status = await anyNav.permissions.query({ name: 'camera' as any });
          if (status.state === 'granted') {
            await startPreview();
          }
        }
      } catch (err) {
        // Permission API not available or error - user can still click button
        console.log('Permission check failed:', err);
      }
    })();
  }, [isInitialized, isActive, isPreviewMode, startPreview]);

  // Auto-start exercise tracking when alarm loads AND MediaPipe is ready
  // Auto-start only if camera permission is already granted (prevents NotAllowedError in iframes)
  useEffect(() => {
    const maybeAutoStart = async () => {
      if (!alarm || !isInitialized || hasStarted || isActive || hasAutoStartedRef.current) return;

      let canAutoStart = false;
      try {
        const anyNav: any = navigator as any;
        if (anyNav?.permissions?.query) {
          const status = await anyNav.permissions.query({ name: 'camera' as any });
          canAutoStart = status.state === 'granted';
        }
      } catch (e) {
        // Permissions API not supported; do not auto start to ensure user gesture
        canAutoStart = false;
      }

      if (canAutoStart) {
        console.log('🎯 Auto-starting push-up tracking for alarm:', alarm.label);
        console.log('📊 Target push-ups:', alarm.push_up_count);
        console.log('🔊 Alarm sound:', alarm.alarm_sound);
        console.log('✅ MediaPipe ready, starting camera...');
        hasAutoStartedRef.current = true;
        setHasStarted(true);
        setStartTime(Date.now());
        startExercise();

        // Retry once after 3 seconds if no landmarks detected
        setTimeout(() => {
          if (!isActive && landmarks.length === 0) {
            console.log('🔄 Retrying camera start...');
            startExercise();
          }
        }, 3000);
      } else {
        console.log('⚠️ Camera permission not granted yet. Waiting for user to tap Start.');
      }
    };

    maybeAutoStart();
  }, [alarm, isInitialized, isActive, landmarks.length, hasStarted]);

  // Canvas sizing - match video display dimensions with device pixel ratio
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    if (!isActive && !isPreviewMode) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const updateCanvasSize = () => {
      const rect = video.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width && rect.height) {
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
    };

    updateCanvasSize();
    video.addEventListener('loadedmetadata', updateCanvasSize);
    window.addEventListener('orientationchange', updateCanvasSize);

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

  // Draw pose overlay with tracking markers
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      console.log('[AlarmCanvas] Missing refs:', { canvas: !!canvas, video: !!video });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('[AlarmCanvas] No 2d context');
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    console.log('[AlarmCanvas] Drawing:', {
      canvasSize: `${canvas.width}x${canvas.height}`,
      cssSize: `${cssW}x${cssH}`,
      videoSize: `${video.videoWidth}x${video.videoHeight}`,
      landmarksCount: landmarks.length,
      isActive,
      isPaused,
      dpr
    });

    // Clear entire canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Source (intrinsic) video size
    const srcW = video.videoWidth || cssW;
    const srcH = video.videoHeight || cssH;

    // object-fit: cover transformation
    const scale = Math.max(cssW / srcW, cssH / srcH);
    const dx = (cssW - srcW * scale) / 2;
    const dy = (cssH - srcH * scale) / 2;

    // Apply DPR and mapping transform
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(dx, dy);
    ctx.scale(scale, scale);

    // Draw pose skeleton - ALWAYS show when landmarks exist
    if (landmarks.length > 0) {
      console.log('[AlarmCanvas] Drawing pose with', landmarks.length, 'landmarks');
      drawPose(ctx, landmarks, srcW, srcH, formIssues, misalignedJoints, isRepFlashing);

      // Draw tracking markers when active
      if (isActive && !isPaused) {
        console.log('[AlarmCanvas] Drawing tracking markers');
        const MID_Y = 0.50 * srcH;
        const BOTTOM_Y = 0.68 * srcH;
        const nose = landmarks[0];

        // Yellow dashed line (mid reference)
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 10]);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, MID_Y);
        ctx.lineTo(srcW, MID_Y);
        ctx.stroke();

        if (nose) {
          const noseY = nose.y * srcH;
          const normalizedY = nose.y;
          const distanceToBottom = Math.abs(noseY - BOTTOM_Y);
          const isCrossing = noseY >= BOTTOM_Y - 5 && noseY <= BOTTOM_Y + 5;
          const isNearBottom = distanceToBottom < 30;

          // Red dashed line (bottom threshold) - glows when nose is near/crossing
          if (isCrossing) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 30;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 6;
          } else if (isNearBottom) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 5;
          } else {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
          }
          ctx.setLineDash([15, 10]);
          ctx.globalAlpha = isCrossing ? 1.0 : 0.8;
          ctx.beginPath();
          ctx.moveTo(0, BOTTOM_Y);
          ctx.lineTo(srcW, BOTTOM_Y);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Nose tracking circle with reactive colors
          const THRESHOLD = 0.68;
          const isBelowLine = normalizedY > THRESHOLD;
          const isThisLandmarkCrossing = Math.abs(normalizedY - THRESHOLD) < 0.02;

          ctx.setLineDash([]);

          // Color changes synchronized with rep counting
          if (isRepFlashing) {
            // Bright green flash when rep is counted
            ctx.strokeStyle = '#22c55e';
            ctx.fillStyle = '#22c55e';
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 25;
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.9;
          } else if (isBelowLine) {
            // Orange when below line
            ctx.strokeStyle = '#f97316';
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 5;
            ctx.globalAlpha = 0.7;
          } else {
            // Blue when above line
            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.6;
          }

          ctx.beginPath();
          ctx.arc(nose.x * srcW, noseY, isThisLandmarkCrossing ? 25 : 20, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.globalAlpha = isThisLandmarkCrossing ? 0.4 : 0.3;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Visual crossing detection for rep counting
          if (!visualCrossingRef.current.initialized) {
            visualCrossingRef.current = { below: isBelowLine, initialized: true };
          } else if (visualCrossingRef.current.below && !isBelowLine) {
            // Crossed from below to above - count rep
            console.log('🎯 Visual crossing detected - counting rep!');
            countRepNow();
            visualCrossingRef.current.below = false;
          } else if (!visualCrossingRef.current.below && isBelowLine) {
            visualCrossingRef.current.below = true;
          }
        }

        ctx.restore();
      }
    } else {
      console.log('[AlarmCanvas] No landmarks to draw');
    }
  }, [landmarks, isActive, isPaused, formIssues, misalignedJoints, isRepFlashing, countRepNow]);

  // Start alarm sound
  useEffect(() => {
    if (alarm && !isAlarmMuted) {
      console.log('🔊 Playing alarm sound:', alarm.alarm_sound);
      playAlarm();
      
      // Start vibration pattern if supported
      if ('vibrate' in navigator) {
        console.log('📳 Starting vibration pattern');
        navigator.vibrate([500, 200, 500, 200, 500]);
        const vibrateInterval = setInterval(() => {
          navigator.vibrate([500, 100, 500]);
        }, 2000);
        
        return () => {
          clearInterval(vibrateInterval);
          stopAlarm();
        };
      }
    }
    return () => stopAlarm();
  }, [alarm, isAlarmMuted]);

  // Check if target reached
  useEffect(() => {
    if (hasStarted && alarm && reps >= alarm.push_up_count) {
      handleComplete();
    }
  }, [reps, hasStarted, alarm]);

  const handleStartPushUps = async () => {
    try {
      // Preflight permission request to trigger browser prompt, then release immediately
      if (navigator.mediaDevices?.getUserMedia) {
        const preflight = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        preflight.getTracks().forEach((t) => t.stop());
      }

      await startExercise();
      setHasStarted(true);
      setStartTime(Date.now());
      setCameraError(null);
    } catch (err: any) {
      console.error('Camera access error:', err);
      const name = err?.name || 'CameraError';
      setCameraError(name);
      toast.error('Could not access camera. Please grant permission.');

      // If embedded previews block camera, automatically offer full window
      const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
      const blocked = name === 'NotAllowedError' || /Permission denied|denied/i.test(err?.message || '');
      if (isEmbedded && blocked) {
        // Attempt to open the same page in a new tab where camera permissions are allowed
        window.open(window.location.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleEndWorkout = () => {
    if (confirm('⚠️ End workout and dismiss alarm without completing?')) {
      stopAlarm();
      stopWorkout();
      alarmStorageService.clearRingingAlarm();
      navigate('/fitness-alarm');
    }
  };

  if (!alarm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading alarm...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Position Tracking Card */}
        {isActive && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Nose Tracking</span>
                </div>
                <Badge className={cn(
                  "font-semibold",
                  repState === 'above_threshold' ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
                )}>
                  {repState === 'above_threshold' ? '↓ Nose Down' : '↑ Nose Up'}
                </Badge>
              </div>
              
              {/* Visual Range Bar */}
              <div className="relative h-20 bg-muted rounded-lg border">
                {/* Down threshold (red dashed) */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 border-dashed"
                  style={{ top: `${(downThreshold / 1) * 100}%` }} 
                />
                
                {/* Up threshold (green) */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-green-500"
                  style={{ top: `${(upThreshold / 1) * 100}%` }} 
                />
                
                {/* Current position marker */}
                <div 
                  className="absolute left-0 right-0 flex justify-center transition-all duration-200"
                  style={{ top: `${currentYPosition * 100}%` }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border-4 border-white shadow-lg transition-colors",
                    repState === 'above_threshold' ? 'bg-blue-500' : 'bg-green-500'
                  )} />
                </div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-muted/50">
                  <div className="font-semibold text-muted-foreground">Nose Y</div>
                  <div className="text-base font-bold">{currentYPosition.toFixed(3)}</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="font-semibold text-muted-foreground">Range</div>
                  <div className="text-base font-bold">{positionRange.toFixed(3)}</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="font-semibold text-muted-foreground">Confidence</div>
                  <div className="text-base font-bold">High</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Video Container with Phase Ring */}
        <Card className={cn(
          "relative overflow-hidden bg-black transition-all duration-300",
          isActive && currentPhase === 'up' && "ring-4 ring-green-500/50",
          isActive && currentPhase === 'down' && "ring-4 ring-blue-500/50",
          isActive && currentPhase === 'transition' && "ring-4 ring-yellow-500/50"
        )}>
          <div className="relative aspect-[9/16] bg-black max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                isMirrored && "scale-x-[-1]"
              )}
            />
            <canvas
              ref={canvasRef}
              className={cn("absolute inset-0 w-full h-full pointer-events-none z-30", isMirrored && "scale-x-[-1]")}
              style={{ mixBlendMode: 'normal' }}
            />
            
            {/* Camera Controls - Top Right */}
            {isActive && (
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                <Button
                  onClick={switchCamera}
                  size="icon"
                  className="rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
                >
                  <SwitchCamera className="w-4 h-4 text-white" />
                </Button>
                
                <Button
                  onClick={toggleMirror}
                  size="icon"
                  className={cn(
                    "rounded-full w-10 h-10 backdrop-blur-sm border border-white/20",
                    isMirrored ? "bg-primary/70 hover:bg-primary/80" : "bg-black/50 hover:bg-black/70"
                  )}
                >
                  <FlipHorizontal className="w-4 h-4 text-white" />
                </Button>
                
                <Button
                  onClick={toggleVoice}
                  size="icon"
                  className={cn(
                    "rounded-full w-10 h-10 backdrop-blur-sm border border-white/20",
                    isVoiceEnabled ? "bg-blue-500/70 hover:bg-blue-600/70" : "bg-black/50 hover:bg-black/70"
                  )}
                >
                  {isVoiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white" />
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setIsAlarmMuted(!isAlarmMuted);
                    if (isAlarmMuted) {
                      playAlarm();
                      toast.info('Alarm unmuted');
                    } else {
                      stopAlarm();
                      toast.success('Alarm muted');
                    }
                  }}
                  size="icon"
                  className={cn(
                    "rounded-full w-10 h-10 backdrop-blur-sm border border-white/20",
                    isAlarmMuted ? "bg-orange-500/70 hover:bg-orange-600/70" : "bg-black/50 hover:bg-black/70"
                  )}
                  title={isAlarmMuted ? "Unmute Alarm" : "Mute Alarm"}
                >
                  {isAlarmMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </Button>
              </div>
            )}

            {/* Status Badges - Top Left */}
            {isActive && (
              <div className="absolute top-4 left-4 space-y-2 z-10">
                <Badge className="text-sm px-3 py-1 bg-green-500/90 backdrop-blur-sm hover:bg-green-500/90">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                  Rep Tracking Active
                </Badge>
                
                {currentPhase && (
                  <Badge className={cn(
                    "text-sm px-3 py-1 backdrop-blur-sm font-semibold",
                    currentPhase === 'up' && "bg-green-500/90 hover:bg-green-500/90",
                    currentPhase === 'down' && "bg-blue-500/90 hover:bg-blue-500/90",
                    currentPhase === 'transition' && "bg-yellow-500/90 hover:bg-yellow-500/90"
                  )}>
                    {currentPhase === 'up' ? '↑ UP' : currentPhase === 'down' ? '↓ DOWN' : '• TRANSITION'}
                  </Badge>
                )}
              </div>
            )}
            
            {!isActive && !isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center text-white p-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg font-semibold">Initializing Camera...</p>
                  <p className="text-sm text-white/70 mt-2">Setting up push-up tracking</p>
                </div>
              </div>
            )}
            
            {isInitialized && !isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center space-y-3">
                    {cameraError && (
                      <p className="text-white/80 text-sm px-4">
                        Camera permission was blocked. If you’re viewing in an embedded preview, open this page in a new tab to allow access.
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-3">
                      <Button 
                        onClick={handleStartPushUps}
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Enable Camera
                      </Button>
                      {isEmbedded && (
                        <Button
                          onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
                          variant="secondary"
                          size="lg"
                        >
                          Open in new tab
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
            )}
            
            
            {/* Direction cues - left side */}
            {isActive && currentPhase && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none z-10">
                <div className="text-6xl font-black mb-2">
                  {currentPhase === 'down' ? '↓' : currentPhase === 'up' ? '↑' : '•'}
                </div>
                <div className="text-sm font-semibold uppercase tracking-wider">
                  {currentPhase === 'down' ? 'Down' : currentPhase === 'up' ? 'Up' : 'Hold'}
                </div>
              </div>
            )}
            
            {/* Enhanced Animated Rep Counter - right side */}
            {isActive && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                <div className="flex flex-col items-center gap-2">
                  <div 
                    key={reps}
                    className={cn(
                      "text-8xl font-black leading-none tabular-nums transition-all animate-scale-in",
                      isRepFlashing ? "text-green-400" : 
                      formScore >= 90 ? "text-green-400" : 
                      formScore >= 75 ? "text-yellow-400" : 
                      "text-orange-400"
                    )}
                    style={{
                      textShadow: isRepFlashing 
                        ? '0 0 50px rgba(34, 197, 94, 1), 0 0 30px rgba(34, 197, 94, 0.8)' 
                        : '0 0 40px rgba(0,0,0,0.9), 0 0 20px currentColor',
                      transform: isRepFlashing ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.3s ease-out'
                    }}
                  >
                    {reps}
                  </div>
                  <div className="text-sm text-white/80 font-semibold">
                    / {alarm.push_up_count}
                  </div>
                </div>
              </div>
            )}
            
            {/* Form score badge */}
            {isActive && (
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-semibold">Form: {formScore}%</span>
              </div>
            )}
          </div>
        </Card>

        {/* Control buttons */}
        {isActive && (
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => isPaused ? resume() : pause()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Pause className="w-4 h-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            
            <Button
              onClick={handleEndWorkout}
              variant="destructive"
              size="lg"
            >
              End Workout
            </Button>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Success overlay */}
        {reps >= alarm.push_up_count && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center text-white p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold mb-2">Alarm Dismissed!</h2>
              <p className="text-xl text-white/80">
                {reps} push-ups completed
              </p>
              <p className="text-sm text-white/60 mt-4">Redirecting...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
