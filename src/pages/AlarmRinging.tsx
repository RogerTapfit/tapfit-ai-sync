import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlarmPushUpTracker } from '@/components/AlarmPushUpTracker';
import { useFitnessAlarm } from '@/hooks/useFitnessAlarm';
import { useLiveExercise } from '@/hooks/useLiveExercise';
import { useAlarmAudio } from '@/hooks/useAlarmAudio';
import { alarmStorageService } from '@/services/alarmStorageService';
import { Play } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function AlarmRinging() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alarms, logCompletion } = useFitnessAlarm();
  const [alarm, setAlarm] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const completedRef = useRef(false);
  const hasAutoStartedRef = useRef(false);

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
  } = useLiveExercise({
    exerciseType: 'pushups',
    targetReps: alarm?.push_up_count ?? 10,
    onComplete: handleComplete,
  });

  // Load alarm data
  useEffect(() => {
    if (id && alarms) {
      const foundAlarm = alarms.find(a => a.id === id);
      setAlarm(foundAlarm);
    }
  }, [id, alarms]);

  // Auto-start exercise tracking when alarm loads AND MediaPipe is ready
  useEffect(() => {
    if (alarm && isInitialized && !hasStarted && !isActive && !hasAutoStartedRef.current) {
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
    }
  }, [alarm, isInitialized, isActive, landmarks.length]);

  // Start alarm sound
  useEffect(() => {
    if (alarm) {
      playAlarm();
      
      // Vibrate device
      if ('vibrate' in navigator) {
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
  }, [alarm]);

  // Check if target reached
  useEffect(() => {
    if (hasStarted && alarm && reps >= alarm.push_up_count) {
      handleComplete();
    }
  }, [reps, hasStarted, alarm]);

  const handleStartPushUps = async () => {
    setHasStarted(true);
    setStartTime(Date.now());
    await startExercise();
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
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Exercise tracking screen - auto-starts */}
      <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Loading overlay while initializing */}
          {!isInitialized && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto" />
                <p className="text-xl">Initializing camera...</p>
                <p className="text-sm text-white/60">Please wait a moment</p>
              </div>
            </div>
          )}
          
          {/* Show manual start button if not active after initialization */}
          {isInitialized && !isActive && !hasStarted && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <Button 
                onClick={handleStartPushUps}
                size="lg"
                className="text-2xl py-8 px-12"
              >
                <Play className="h-8 w-8 mr-4" />
                Start Push-Ups
              </Button>
            </div>
          )}
          
          {/* Pose overlay canvas only - no built-in HUD */}
          {landmarks.length > 0 && (
            <AlarmPushUpTracker
              landmarks={landmarks}
              reps={reps}
              targetReps={alarm.push_up_count}
              formScore={formScore}
              hideHud
              showReferenceLine
            />
          )}

          {/* Direction cue - UP/DOWN indicator */}
          {hasStarted && isActive && (
            <div className={`absolute right-4 top-24 rounded-xl px-6 py-3 text-black font-bold text-xl shadow-lg transition-all ${
              currentPhase === 'up' ? 'bg-emerald-400' : currentPhase === 'down' ? 'bg-sky-400' : 'bg-yellow-400'
            }`}>
              {currentPhase === 'up' ? '↑ UP' : currentPhase === 'down' ? '↓ DOWN' : '•'}
            </div>
          )}

          {/* Big circular rep counter */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-center">
            <div className="w-28 h-28 rounded-full bg-emerald-500 text-black flex items-center justify-center text-6xl font-black shadow-2xl border-4 border-white">
              {reps}
            </div>
            <div className="mt-2 text-white/90 text-sm font-bold">/ {alarm.push_up_count}</div>
          </div>

          {/* Form score indicator - left side */}
          {hasStarted && isActive && (
            <div className="absolute left-4 top-24 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-xl">
              <div className="text-xs text-white/60 font-medium">FORM</div>
              <div className="text-3xl font-black text-white">{formScore}%</div>
            </div>
          )}

          {/* Bottom control bar */}
          {hasStarted && isActive && (
            <div className="absolute inset-x-0 bottom-20 flex items-center justify-center gap-3 px-4">
              <Button 
                variant="secondary" 
                size="lg"
                onClick={isPaused ? resume : pause}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 font-bold"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                onClick={toggleVoice}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 font-bold"
              >
                {isVoiceEnabled ? '🔊 Voice' : '🔇 Muted'}
              </Button>
              <Button 
                variant="destructive"
                size="lg"
                onClick={handleEndWorkout}
                className="font-bold"
              >
                End Workout
              </Button>
            </div>
          )}

          {/* Bottom progress bar */}
          <div className="absolute left-0 right-0 bottom-0 h-3 bg-black/40">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300" 
              style={{ width: `${Math.min(100, (reps / (alarm.push_up_count || 1)) * 100)}%` }} 
            />
          </div>

          {/* Completion celebration overlay */}
          {reps >= alarm.push_up_count && (
            <div className="absolute inset-0 bg-emerald-500/95 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="text-9xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-6xl font-black mb-4 text-white">ALARM OFF!</h2>
                <p className="text-2xl text-white/90">Great job! You're awake now!</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
