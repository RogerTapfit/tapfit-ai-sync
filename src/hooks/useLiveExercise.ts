import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initializePoseVideo,
  detectPoseVideo,
  calculateAlignment,
  type Keypoint,
  type AlignmentResult,
} from "@/features/bodyScan/ml/poseVideo";
import { detectExercise, type ExerciseType, type FormIssue } from '@/utils/exerciseDetection';
import { idealPoseTemplates, type IdealPoseKeypoint } from '@/features/bodyScan/ml/idealPoseTemplates';
import { toast } from 'sonner';
import { useWorkoutAudio } from './useWorkoutAudio';
import { getCoachingPhrase, shouldCoach } from '@/services/workoutVoiceCoaching';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface UseLiveExerciseProps {
  exerciseType: ExerciseType;
  targetReps?: number;
  onComplete?: (stats: WorkoutStats) => void;
}

export interface WorkoutStats {
  reps: number;
  sets: number;
  duration: number;
  avgFormScore: number;
  caloriesBurned: number;
}

export function useLiveExercise({ exerciseType, targetReps = 10, onComplete }: UseLiveExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isReadyForAutoStart, setIsReadyForAutoStart] = useState(false);
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);
  const [reps, setReps] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'up' | 'down' | 'transition'>('up');
  const [formScore, setFormScore] = useState(100);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [formIssues, setFormIssues] = useState<FormIssue[]>([]);
  const [duration, setDuration] = useState(0);
  const [landmarks, setLandmarks] = useState<Keypoint[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [distanceStatus, setDistanceStatus] = useState<'too-close' | 'too-far' | 'perfect' | null>(null);
  const [poseConfidence, setPoseConfidence] = useState<number>(0);
  const [repSpeed, setRepSpeed] = useState<'too-fast' | 'too-slow' | 'perfect' | null>(null);
  const [lastRepDuration, setLastRepDuration] = useState<number>(0);
  const [showIdealPose, setShowIdealPose] = useState(true); // Enabled by default
  const [idealPoseLandmarks, setIdealPoseLandmarks] = useState<IdealPoseKeypoint[]>([]);
  const [alignmentScore, setAlignmentScore] = useState<number>(0);
  const [misalignedJoints, setMisalignedJoints] = useState<number[]>([]);
  const [isRepFlashing, setIsRepFlashing] = useState(false);
  
  // Debug states for angle tracking
  const [currentElbowAngle, setCurrentElbowAngle] = useState<number>(0);
  
  // Velocity tracking states
  const [concentricVelocity, setConcentricVelocity] = useState<number>(0); // Time for up phase (ms)
  const [eccentricVelocity, setEccentricVelocity] = useState<number>(0); // Time for down phase (ms)
  const [concentricZone, setConcentricZone] = useState<'explosive' | 'moderate' | 'slow' | null>(null);
  const [eccentricZone, setEccentricZone] = useState<'explosive' | 'moderate' | 'slow' | null>(null);
  
  // Rest timer states
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [restDuration, setRestDuration] = useState(60); // Default 60 seconds
  const [currentSet, setCurrentSet] = useState(0);
  const restIntervalRef = useRef<number | null>(null);
  
  // Animation states for smooth pose transitions
  const [currentIdealPose, setCurrentIdealPose] = useState<IdealPoseKeypoint[]>([]);
  const [targetIdealPose, setTargetIdealPose] = useState<IdealPoseKeypoint[]>([]);
  const [animationProgress, setAnimationProgress] = useState<number>(1); // 0-1, 1 means complete
  const animationStartTimeRef = useRef<number>(0);
  const animationDurationRef = useRef<number>(800); // 800ms transition

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPhaseRef = useRef<'up' | 'down' | 'transition'>('up');
  const formScoresRef = useRef<number[]>([]);
  const lastRepTimeRef = useRef<number>(0);
  const lastAnnouncedRep = useRef<number>(0);
  const repStartTimeRef = useRef<number>(0);
  const downPhaseStartRef = useRef<number>(0);
  const upPhaseStartRef = useRef<number>(0);
  const lastCoachingTimeRef = useRef<number>(0);
  const lastFormCoachingRef = useRef<number>(0);
  const lastHapticAngleRef = useRef<number>(0);
  const autoStartTimerRef = useRef<number | null>(null);
  const readyPositionStartTimeRef = useRef<number | null>(null);
  
  const { speak, clearQueue, isSpeaking } = useWorkoutAudio();

  // Haptic feedback for angle thresholds
  const triggerAngleHaptic = useCallback(async (angle: number, phase: 'up' | 'down' | 'transition') => {
    // Only for pushups
    if (exerciseType !== 'pushups') return;
    
    // Avoid spamming haptics - require at least 15° change
    const angleDiff = Math.abs(angle - lastHapticAngleRef.current);
    if (angleDiff < 15) return;
    
    try {
      // Down position achieved (< 105°)
      if (angle < 105 && lastHapticAngleRef.current >= 105) {
        await Haptics.impact({ style: ImpactStyle.Medium });
        lastHapticAngleRef.current = angle;
      }
      // Up position achieved (> 150°)
      else if (angle > 150 && lastHapticAngleRef.current <= 150) {
        await Haptics.impact({ style: ImpactStyle.Light });
        lastHapticAngleRef.current = angle;
      }
    } catch (error) {
      // Haptics not supported or failed - silently ignore
      console.log('Haptics not available:', error);
    }
  }, [exerciseType]);

  // Optimal rep duration ranges (in milliseconds) for different exercises
  const getOptimalRepRange = useCallback((exercise: ExerciseType): { min: number; max: number } => {
    const ranges: Record<ExerciseType, { min: number; max: number }> = {
      pushups: { min: 2000, max: 4000 },      // 2-4 seconds per rep
      squats: { min: 2500, max: 4500 },       // 2.5-4.5 seconds per rep
      lunges: { min: 2000, max: 4000 },       // 2-4 seconds per rep
      jumping_jacks: { min: 800, max: 1500 }, // 0.8-1.5 seconds per rep (faster exercise)
      high_knees: { min: 400, max: 800 },     // 0.4-0.8 seconds per rep (high intensity)
    };
    return ranges[exercise] || { min: 2000, max: 4000 };
  }, []);

  // Analyze rep speed based on duration
  const analyzeRepSpeed = useCallback((duration: number): 'too-fast' | 'too-slow' | 'perfect' => {
    const range = getOptimalRepRange(exerciseType);
    if (duration < range.min) return 'too-fast';
    if (duration > range.max) return 'too-slow';
    return 'perfect';
  }, [exerciseType, getOptimalRepRange]);

  // Classify velocity zone for phase duration
  const classifyVelocityZone = useCallback((phaseDuration: number, exerciseType: ExerciseType): 'explosive' | 'moderate' | 'slow' => {
    // Define velocity zones based on phase duration (ms)
    // Explosive: <1s, Moderate: 1-2s, Slow: >2s for most exercises
    // Adjust for high-intensity exercises
    const isHighIntensity = exerciseType === 'jumping_jacks' || exerciseType === 'high_knees';
    
    if (isHighIntensity) {
      if (phaseDuration < 200) return 'explosive';
      if (phaseDuration < 500) return 'moderate';
      return 'slow';
    } else {
      if (phaseDuration < 1000) return 'explosive';
      if (phaseDuration < 2000) return 'moderate';
      return 'slow';
    }
  }, []);

  // Get ideal pose template based on current phase
  const getIdealPoseForPhase = useCallback((phase: 'up' | 'down'): IdealPoseKeypoint[] => {
    if (!exerciseType) return [];
    const template = idealPoseTemplates[exerciseType];
    return template ? template[phase] : [];
  }, [exerciseType]);

  // Linear interpolation between two keypoints
  const lerpKeypoint = useCallback((a: IdealPoseKeypoint, b: IdealPoseKeypoint, t: number): IdealPoseKeypoint => {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }, []);

  // Interpolate between two poses
  const lerpPose = useCallback((pose1: IdealPoseKeypoint[], pose2: IdealPoseKeypoint[], t: number): IdealPoseKeypoint[] => {
    if (pose1.length !== pose2.length || pose1.length === 0) return pose1;
    return pose1.map((kp, idx) => lerpKeypoint(kp, pose2[idx], t));
  }, [lerpKeypoint]);

  // Easing function for smooth animation (ease-in-out)
  const easeInOutCubic = useCallback((t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }, []);

  // Toggle ideal pose guide
  const toggleIdealPose = useCallback(() => {
    setShowIdealPose(prev => !prev);
  }, []);

  // Start pose animation
  const startPoseAnimation = useCallback((newTargetPose: IdealPoseKeypoint[]) => {
    if (newTargetPose.length === 0) return;
    
    // Set current pose as starting point
    setCurrentIdealPose(idealPoseLandmarks.length > 0 ? idealPoseLandmarks : newTargetPose);
    setTargetIdealPose(newTargetPose);
    setAnimationProgress(0);
    animationStartTimeRef.current = Date.now();
  }, [idealPoseLandmarks]);

  // Calculate pose confidence from landmarks
  const calculatePoseConfidence = useCallback((landmarks: Keypoint[]): number => {
    if (landmarks.length === 0) return 0;
    
    // Calculate average confidence from all landmarks
    // Focus on key body landmarks (shoulders, hips, knees, elbows)
    const keyLandmarkIndices = [11, 12, 13, 14, 23, 24, 25, 26]; // shoulders, elbows, hips, knees
    let totalConfidence = 0;
    let count = 0;
    
    keyLandmarkIndices.forEach(idx => {
      if (landmarks[idx]) {
        totalConfidence += landmarks[idx].visibility || 0;
        count++;
      }
    });
    
    return count > 0 ? (totalConfidence / count) * 100 : 0;
  }, []);

  // Calculate distance status based on pose size
  const calculateDistanceStatus = useCallback((landmarks: Keypoint[]): 'too-close' | 'too-far' | 'perfect' => {
    if (landmarks.length < 10) return 'too-far';

    // Calculate bounding box of all landmarks
    let minY = 1, maxY = 0;
    landmarks.forEach(lm => {
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
    });

    const poseHeight = maxY - minY;
    
    // Optimal range: pose should take up 50-70% of frame height
    if (poseHeight > 0.70) return 'too-close';
    if (poseHeight < 0.45) return 'too-far';
    return 'perfect';
  }, []);

  // Initialize MediaPipe
  useEffect(() => {
    initializePoseVideo()
      .then(() => {
        setIsInitialized(true);
        console.log('MediaPipe initialized for video mode');
      })
      .catch((err) => {
        console.error('Failed to initialize MediaPipe:', err);
        toast.error('Failed to initialize pose detection');
      });
  }, []);

  // Ensure video element always has the stream attached
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [isActive, isPreviewMode]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 1280, 
          height: 720,
          facingMode
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera. Please grant permission.');
      return false;
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start rest timer
  const startRestTimer = useCallback(() => {
    setIsResting(true);
    setRestTimer(restDuration);
    setIsPaused(true); // Pause rep counting during rest
    
    // Clear any existing interval
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    
    // Start countdown
    restIntervalRef.current = window.setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          // Rest complete
          if (restIntervalRef.current) {
            clearInterval(restIntervalRef.current);
            restIntervalRef.current = null;
          }
          setIsResting(false);
          setIsPaused(false);
          setReps(0); // Reset reps for next set
          lastAnnouncedRep.current = 0;
          formScoresRef.current = [];
          
          const restCompletePhrase = getCoachingPhrase({ 
            type: 'rest_countdown', 
            data: { restTimeLeft: 0 } 
          });
          speak(restCompletePhrase || 'Rest complete! Start your next set.', 'high');
          toast.success('Rest complete! Begin next set', { duration: 2000 });
          return 0;
        }
        
        // Voice coaching during rest countdown
        if ([30, 15, 10, 5].includes(prev)) {
          const countdownPhrase = getCoachingPhrase({ 
            type: 'rest_countdown', 
            data: { restTimeLeft: prev } 
          });
          if (countdownPhrase) {
            speak(countdownPhrase, prev === 5 ? 'high' : 'normal');
          }
        }
        
        return prev - 1;
      });
    }, 1000);
  }, [restDuration, speak]);

  // Update rest duration
  const updateRestDuration = useCallback((duration: 30 | 60 | 90) => {
    setRestDuration(duration);
  }, []);

  // Skip rest
  const skipRest = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setIsResting(false);
    setRestTimer(0);
    setIsPaused(false);
    setReps(0);
    lastAnnouncedRep.current = 0;
    formScoresRef.current = [];
    speak('Rest skipped. Starting next set.', 'normal');
  }, [speak]);

  // Complete workout manually
  const completeWorkout = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    
    const avgFormScore = formScoresRef.current.length > 0 
      ? formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length 
      : 100;
    
    const stats: WorkoutStats = {
      reps: reps,
      sets: currentSet,
      duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      avgFormScore: Math.round(avgFormScore),
      caloriesBurned: Math.round((currentSet * targetReps) * 0.5)
    };
    
    speak('Workout complete!', 'high');
    setIsActive(false);
    setIsResting(false);
    if (onComplete) {
      onComplete(stats);
    }
  }, [reps, currentSet, targetReps, onComplete, speak]);

  // Process video frame
  const processFrame = useCallback(async (timestamp: number) => {
    if (!videoRef.current || !isInitialized) return;
    if (!isPreviewMode && !isActive) return;
    if (isActive && isPaused) return;

    const video = videoRef.current;

    // Validate video is ready with valid dimensions before processing
    if (
      video.readyState < 2 || // HAVE_CURRENT_DATA
      video.videoWidth <= 0 ||
      video.videoHeight <= 0 ||
      video.currentTime <= 0
    ) {
      // Video not ready yet, skip this frame gracefully
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const result = await detectPoseVideo(video, timestamp);
    
    if (result.ok && result.landmarks.length > 0) {
      setLandmarks(result.landmarks);
      
      // Calculate and update pose confidence
      const confidence = calculatePoseConfidence(result.landmarks);
      setPoseConfidence(confidence);

      // Preview mode: only show landmarks and distance feedback
      if (isPreviewMode) {
        const distance = calculateDistanceStatus(result.landmarks);
        setDistanceStatus(distance);
        
        // Auto-start detection: Check if user is in starting position
        const detection = detectExercise(exerciseType, result.landmarks, 'up');
        const isInStartPosition = detection.phase === 'up';
        const hasGoodForm = detection.formScore > 60;
        const hasGoodConfidence = confidence > 70;
        
        if (isInStartPosition && hasGoodForm && hasGoodConfidence) {
          const now = Date.now();
          
          if (!readyPositionStartTimeRef.current) {
            // First time in ready position
            readyPositionStartTimeRef.current = now;
            setIsReadyForAutoStart(true);
            speak("Get ready", 'high');
          } else {
            // Calculate countdown
            const timeInPosition = (now - readyPositionStartTimeRef.current) / 1000;
            const countdown = Math.max(0, 3 - Math.floor(timeInPosition));
            
            if (countdown > 0 && countdown !== readyCountdown) {
              setReadyCountdown(countdown);
              speak(countdown.toString(), 'high');
            } else if (countdown === 0 && readyCountdown !== 0) {
              setReadyCountdown(0);
              speak("Let's start!", 'high');
              
              // Auto-start the workout after a brief delay
              if (autoStartTimerRef.current) {
                clearTimeout(autoStartTimerRef.current);
              }
              autoStartTimerRef.current = window.setTimeout(() => {
                setIsPreviewMode(false);
                setIsActive(true);
                startTimeRef.current = Date.now();
                readyPositionStartTimeRef.current = null;
                setIsReadyForAutoStart(false);
                setReadyCountdown(null);
              }, 800); // Small delay after "Let's start!"
            }
          }
        } else {
          // Reset if user moves out of position
          if (readyPositionStartTimeRef.current) {
            readyPositionStartTimeRef.current = null;
            setIsReadyForAutoStart(false);
            setReadyCountdown(null);
            if (autoStartTimerRef.current) {
              clearTimeout(autoStartTimerRef.current);
              autoStartTimerRef.current = null;
            }
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Active workout mode: full tracking
      if (isActive) {
        // Detect exercise
        const detection = detectExercise(exerciseType, result.landmarks, lastPhaseRef.current);
        
        setFormScore(detection.formScore);
        setFeedback(detection.feedback);
        setFormIssues(detection.formIssues || []);
        formScoresRef.current.push(detection.formScore);
        
        // Update elbow angle for pushups
        if (exerciseType === 'pushups' && detection.avgElbowAngle !== undefined) {
          setCurrentElbowAngle(detection.avgElbowAngle);
          
          // Trigger haptic feedback when crossing angle thresholds
          triggerAngleHaptic(detection.avgElbowAngle, detection.phase);
          
          // Debug logging for pushups
          if (Date.now() - lastCoachingTimeRef.current > 2000) {
            console.log('[Pushup Debug]', {
              angle: Math.round(detection.avgElbowAngle),
              phase: detection.phase,
              previousPhase: lastPhaseRef.current,
              willCountRep: lastPhaseRef.current === 'down' && detection.phase === 'up'
            });
          }
        }

        // Update ideal pose template based on phase - start animation on phase change
        if (showIdealPose && detection.phase !== 'transition') {
          const newIdealPose = getIdealPoseForPhase(detection.phase);
          
          // Only start animation if phase actually changed
          if (detection.phase !== lastPhaseRef.current && lastPhaseRef.current !== 'transition') {
            startPoseAnimation(newIdealPose);
          } else if (animationProgress >= 1 && newIdealPose.length > 0) {
            // If no animation in progress and we have a pose, just set it
            setIdealPoseLandmarks(newIdealPose);
          }
          
          // Calculate alignment score with current displayed pose
          if (idealPoseLandmarks.length > 0) {
            const alignment = calculateAlignment(result.landmarks, idealPoseLandmarks);
            setAlignmentScore(alignment.score);
            setMisalignedJoints(alignment.misalignedJoints);
          }
        }

        // Track phase transitions and calculate velocities
        const now = Date.now();
        
        // Transition from up to down - calculate concentric (up) phase velocity
        if (lastPhaseRef.current === 'up' && detection.phase === 'down') {
          repStartTimeRef.current = now;
          
          // Calculate concentric velocity if we have a start time
          if (upPhaseStartRef.current > 0) {
            const upDuration = now - upPhaseStartRef.current;
            setConcentricVelocity(upDuration);
            const zone = classifyVelocityZone(upDuration, exerciseType);
            setConcentricZone(zone);
          }
          
          // Start timing down phase
          downPhaseStartRef.current = now;
        }

        // Transition from down to up - calculate eccentric (down) phase velocity and count rep
        if (lastPhaseRef.current === 'down' && detection.phase === 'up') {
          // Calculate eccentric velocity if we have a start time
          if (downPhaseStartRef.current > 0) {
            const downDuration = now - downPhaseStartRef.current;
            setEccentricVelocity(downDuration);
            const zone = classifyVelocityZone(downDuration, exerciseType);
            setEccentricZone(zone);
          }
          
          // Start timing up phase
          upPhaseStartRef.current = now;
          
          // Debounce reps (minimum 400ms between reps) - reduced for faster response
          if (now - lastRepTimeRef.current > 400) {
            // Calculate rep duration (from start of down phase to end of up phase)
            const repDuration = repStartTimeRef.current > 0 ? now - repStartTimeRef.current : 0;
            
            // Analyze rep speed
            if (repDuration > 0) {
              const speed = analyzeRepSpeed(repDuration);
              setRepSpeed(speed);
              setLastRepDuration(repDuration);
              
              // Voice feedback for rep speed issues (removed - too distracting)
              // Speed feedback is now visual only via badges
            }
            
            setReps(prev => {
              const newReps = prev + 1;
              
              // 🟢 TRIGGER GREEN FLASH
              setIsRepFlashing(true);
              setTimeout(() => setIsRepFlashing(false), 400);
              
              // 📳 HAPTIC FEEDBACK - double pulse for rep completion
              if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
              
              // Completion feedback
              if (newReps >= targetReps) {
                const setCompletePhrase = getCoachingPhrase({ type: 'set_complete' });
                speak(setCompletePhrase || 'Set complete! Rest time.', 'high');
                setCurrentSet(prev => prev + 1);
                startRestTimer();
                toast.success(`Set ${currentSet + 1} complete! Rest for ${restDuration}s`, { duration: 2000 });
              } else if (newReps === targetReps - 2) {
                const nearTargetPhrase = getCoachingPhrase({ type: 'near_target' });
                if (nearTargetPhrase) {
                  speak(nearTargetPhrase, 'normal');
                }
              } else {
                toast.success(`Rep ${newReps}!`, { duration: 1000 });
              }
              
              return newReps;
            });
            lastRepTimeRef.current = now;
          }
        }

        lastPhaseRef.current = detection.phase;
        setCurrentPhase(detection.phase);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isActive, isPaused, isPreviewMode, exerciseType, targetReps, onComplete, isInitialized, isResting, currentSet, restDuration]);

  // Animate ideal pose transitions
  useEffect(() => {
    if (!isActive || animationProgress >= 1) return;
    if (currentIdealPose.length === 0 || targetIdealPose.length === 0) return;

    let rafId: number;

    const animate = () => {
      const elapsed = Date.now() - animationStartTimeRef.current;
      const rawProgress = Math.min(elapsed / animationDurationRef.current, 1);
      const easedProgress = easeInOutCubic(rawProgress);
      
      setAnimationProgress(rawProgress);
      
      // Interpolate between current and target poses
      const interpolatedPose = lerpPose(currentIdealPose, targetIdealPose, easedProgress);
      setIdealPoseLandmarks(interpolatedPose);
      
      if (rawProgress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isActive, animationProgress, currentIdealPose, targetIdealPose, lerpPose, easeInOutCubic]);

  // Voice announcement for rep count - separate from state update to avoid spam
  useEffect(() => {
    if (!isActive || reps === 0) return;
    
    // Only announce if this is a new rep
    if (reps !== lastAnnouncedRep.current) {
      lastAnnouncedRep.current = reps;
      speak(`${reps}`, 'high');
      
      // Milestone coaching only at halfway point
      if (reps === Math.ceil(targetReps / 2)) {
        const milestonePhrase = getCoachingPhrase({ 
          type: 'rep_milestone', 
          data: { currentReps: reps, targetReps } 
        });
        if (milestonePhrase) {
          speak(milestonePhrase, 'normal');
        }
      }
    }
  }, [reps, isActive, targetReps, speak]);

  // Update duration timer
  useEffect(() => {
    if (!isActive || isPaused) return;
    
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  // Start preview mode
  const startPreview = useCallback(async () => {
    if (!isInitialized) return;
    
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;

    // Wait for video to be ready
    if (videoRef.current) {
      await new Promise(resolve => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });
    }

    setIsPreviewMode(true);
    setLandmarks([]);
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [startCamera, processFrame, isInitialized]);

  // Stop preview mode
  const stopPreview = useCallback(() => {
    setIsPreviewMode(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Keep camera running for smooth transition
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    // Stop current camera
    stopCamera();
    
    // Toggle facing mode
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Small delay to ensure old stream is stopped
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restart camera with new facing mode
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      // Revert if failed
      setFacingMode(facingMode);
      return false;
    }
    
    toast.success(`Switched to ${newFacingMode === 'user' ? 'front' : 'rear'} camera`);
    return true;
  }, [facingMode, stopCamera, startCamera]);

  // Start workout
  const start = useCallback(async () => {
    if (!isInitialized) {
      toast.error('Still initializing. Please wait...');
      return;
    }

    // If preview is running, stop it first
    if (isPreviewMode) {
      stopPreview();
    }

    // Start camera if not already running
    if (!streamRef.current) {
      const cameraStarted = await startCamera();
      if (!cameraStarted) return;

      // Wait for video to be ready
      if (videoRef.current) {
        await new Promise(resolve => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }
    }

    setIsActive(true);
    setIsPaused(false);
    setReps(0);
    setDuration(0);
    formScoresRef.current = [];
    startTimeRef.current = Date.now();
    lastPhaseRef.current = 'up';
    lastRepTimeRef.current = 0;
    lastAnnouncedRep.current = 0;
    
    // Set initial ideal pose (without animation)
    if (showIdealPose) {
      const initialPose = getIdealPoseForPhase('up');
    setIdealPoseLandmarks(initialPose);
      setCurrentIdealPose(initialPose);
      setTargetIdealPose(initialPose);
      setAnimationProgress(1);
    }
    
    // Motivational workout start
    const startPhrase = getCoachingPhrase({ type: 'workout_start' });
    speak(startPhrase || 'Starting workout', 'high');
    animationFrameRef.current = requestAnimationFrame(processFrame);
    toast.success('Workout started! Get ready...');
  }, [startCamera, processFrame, isInitialized, isPreviewMode, stopPreview, showIdealPose, getIdealPoseForPhase]);

  // Pause workout
  const pause = useCallback(() => {
    setIsPaused(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Resume workout
  const resume = useCallback(() => {
    setIsPaused(false);
    startTimeRef.current = Date.now() - duration * 1000;
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [duration, processFrame]);

  // Stop workout
  const stop = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setIsResting(false);
    clearQueue();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    stopCamera();
    
    if (onComplete && reps > 0) {
      const avgFormScore = formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length;
      
      // Celebrate workout completion
      const completePhrase = getCoachingPhrase({ type: 'workout_complete' });
      speak(completePhrase || 'Workout complete! Great job!', 'high');
      
      onComplete({
        reps,
        sets: currentSet,
        duration,
        avgFormScore: Math.round(avgFormScore),
        caloriesBurned: Math.round(reps * 0.5)
      });
    }
  }, [stopCamera, onComplete, reps, currentSet, duration, clearQueue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    isPaused,
    isPreviewMode,
    isInitialized,
    isReadyForAutoStart,
    readyCountdown,
    reps,
    targetReps,
    currentPhase,
    formScore,
    feedback,
    formIssues,
    duration,
    landmarks,
    progress: (reps / targetReps) * 100,
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
    isRepFlashing,
    isSpeaking,
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
  };
}
