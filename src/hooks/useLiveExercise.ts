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

interface UseLiveExerciseProps {
  exerciseType: ExerciseType;
  targetReps?: number;
  onComplete?: (stats: WorkoutStats) => void;
}

export interface WorkoutStats {
  reps: number;
  duration: number;
  avgFormScore: number;
  caloriesBurned: number;
}

export function useLiveExercise({ exerciseType, targetReps = 10, onComplete }: UseLiveExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
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
  
  // Velocity tracking states
  const [concentricVelocity, setConcentricVelocity] = useState<number>(0); // Time for up phase (ms)
  const [eccentricVelocity, setEccentricVelocity] = useState<number>(0); // Time for down phase (ms)
  const [concentricZone, setConcentricZone] = useState<'explosive' | 'moderate' | 'slow' | null>(null);
  const [eccentricZone, setEccentricZone] = useState<'explosive' | 'moderate' | 'slow' | null>(null);
  
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
  
  const { speak, clearQueue } = useWorkoutAudio();

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
          
          // Debounce reps (minimum 500ms between reps)
          if (now - lastRepTimeRef.current > 500) {
            // Calculate rep duration (from start of down phase to end of up phase)
            const repDuration = repStartTimeRef.current > 0 ? now - repStartTimeRef.current : 0;
            
            // Analyze rep speed
            if (repDuration > 0) {
              const speed = analyzeRepSpeed(repDuration);
              setRepSpeed(speed);
              setLastRepDuration(repDuration);
              
              // Voice feedback for rep speed issues
              if (speed === 'too-fast') {
                speak('Slow down', 'normal');
              } else if (speed === 'too-slow') {
                speak('Move faster', 'normal');
              }
            }
            
            setReps(prev => {
              const newReps = prev + 1;
              
              // Audio feedback for rep count
              if (newReps !== lastAnnouncedRep.current) {
                lastAnnouncedRep.current = newReps;
                speak(`${newReps}`, 'normal');
                
                // Form feedback every 5 reps
                if (newReps % 5 === 0) {
                  const avgFormScore = formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length;
                  if (avgFormScore > 85) {
                    speak('Excellent form!', 'normal');
                  } else if (avgFormScore > 70) {
                    speak('Good job, keep it up!', 'normal');
                  } else {
                    speak('Focus on your form', 'normal');
                  }
                }
              }
              
              if (newReps >= targetReps && onComplete) {
                // Workout complete
                speak('Workout complete!', 'high');
                const avgFormScore = formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length;
                const stats: WorkoutStats = {
                  reps: newReps,
                  duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
                  avgFormScore: Math.round(avgFormScore),
                  caloriesBurned: Math.round(newReps * 0.5) // Rough estimate
                };
                setTimeout(() => {
                  setIsActive(false);
                  onComplete(stats);
                }, 500);
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
  }, [isActive, isPaused, isPreviewMode, exerciseType, targetReps, onComplete, isInitialized]);

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
    
    speak('Starting workout', 'high');
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
    clearQueue();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    stopCamera();
    
    if (onComplete && reps > 0) {
      const avgFormScore = formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length;
      onComplete({
        reps,
        duration,
        avgFormScore: Math.round(avgFormScore),
        caloriesBurned: Math.round(reps * 0.5)
      });
    }
  }, [stopCamera, onComplete, reps, duration, clearQueue]);

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
    start,
    pause,
    resume,
    stop,
    startPreview,
    stopPreview,
    switchCamera
  };
}
