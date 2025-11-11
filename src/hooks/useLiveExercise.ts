import { useState, useEffect, useRef, useCallback } from 'react';
import { initializePoseVideo, detectPoseVideo, type Keypoint } from '@/features/bodyScan/ml/poseVideo';
import { detectExercise, type ExerciseType, type FormIssue } from '@/utils/exerciseDetection';
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPhaseRef = useRef<'up' | 'down' | 'transition'>('up');
  const formScoresRef = useRef<number[]>([]);
  const lastRepTimeRef = useRef<number>(0);
  const lastAnnouncedRep = useRef<number>(0);
  
  const { speak, clearQueue } = useWorkoutAudio();

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

    const result = await detectPoseVideo(videoRef.current, timestamp);
    
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

        // Count reps on phase transition
        if (lastPhaseRef.current === 'down' && detection.phase === 'up') {
          const now = Date.now();
          // Debounce reps (minimum 500ms between reps)
          if (now - lastRepTimeRef.current > 500) {
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
    
    speak('Starting workout', 'high');
    animationFrameRef.current = requestAnimationFrame(processFrame);
    toast.success('Workout started! Get ready...');
  }, [startCamera, processFrame, isInitialized, isPreviewMode, stopPreview]);

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
    start,
    pause,
    resume,
    stop,
    startPreview,
    stopPreview,
    switchCamera
  };
}
