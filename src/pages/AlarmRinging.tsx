import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlarmPushUpTracker } from '@/components/AlarmPushUpTracker';
import { useFitnessAlarm } from '@/hooks/useFitnessAlarm';
import { useLiveExercise } from '@/hooks/useLiveExercise';
import { useAlarmAudio } from '@/hooks/useAlarmAudio';
import { alarmStorageService } from '@/services/alarmStorageService';
import { Play, AlertCircle } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function AlarmRinging() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alarms, logCompletion } = useFitnessAlarm();
  const [alarm, setAlarm] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { play: playAlarm, stop: stopAlarm } = useAlarmAudio(alarm?.alarm_sound || 'classic');

  async function handleComplete() {
    if (!alarm || !startTime) return;

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
  } = useLiveExercise({
    exerciseType: 'pushups',
    onComplete: handleComplete,
  });

  // Load alarm data
  useEffect(() => {
    if (id && alarms) {
      const foundAlarm = alarms.find(a => a.id === id);
      setAlarm(foundAlarm);
    }
  }, [id, alarms]);

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

  const handleEmergencyDismiss = () => {
    if (!isDismissing) {
      setIsDismissing(true);
      dismissTimerRef.current = setTimeout(() => {
        setIsDismissing(false);
      }, 3000);
    } else {
      if (confirm('⚠️ Are you sure you want to dismiss this alarm without completing the push-ups?')) {
        stopAlarm();
        alarmStorageService.clearRingingAlarm();
        navigate('/fitness-alarm');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  if (!alarm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading alarm...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {!hasStarted ? (
        // Pre-start screen
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-pulse">
          <div className="text-8xl mb-8">⏰</div>
          <h1 className="text-6xl font-black mb-4 text-center">
            WAKE UP!
          </h1>
          <p className="text-2xl text-white/80 mb-2 text-center">
            {alarm.label || 'Fitness Alarm'}
          </p>
          <p className="text-xl text-white/60 mb-12 text-center">
            Complete {alarm.push_up_count} push-ups to turn off this alarm
          </p>
          
          <Button
            size="lg"
            className="h-24 w-64 text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            onClick={handleStartPushUps}
          >
            <Play className="h-8 w-8 mr-3" />
            Start Push-Ups
          </Button>

          <button
            className="mt-8 text-sm text-white/40 hover:text-white/60 transition-colors"
            onMouseDown={handleEmergencyDismiss}
            onMouseUp={() => setIsDismissing(false)}
            onMouseLeave={() => setIsDismissing(false)}
          >
            {isDismissing ? (
              <span className="text-red-400">Hold for 3 seconds to dismiss...</span>
            ) : (
              'Emergency Dismiss (Hold)'
            )}
          </button>
        </div>
      ) : (
        // Exercise tracking screen
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {landmarks.length > 0 && (
            <AlarmPushUpTracker
              landmarks={landmarks}
              reps={reps}
              targetReps={alarm.push_up_count}
              formScore={formScore}
            />
          )}

          {reps >= alarm.push_up_count && (
            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-5xl font-black mb-4">ALARM OFF!</h2>
                <p className="text-xl">Great job! You're awake now!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
