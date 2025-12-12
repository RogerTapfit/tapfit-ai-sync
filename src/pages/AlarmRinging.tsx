import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFitnessAlarm } from '@/hooks/useFitnessAlarm';
import { useScreenTimeBank } from '@/hooks/useScreenTimeBank';
import { useAlarmAudio } from '@/hooks/useAlarmAudio';
import { alarmStorageService } from '@/services/alarmStorageService';
import { VolumeX, Volume2 } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LiveExerciseTracker } from '@/components/LiveExerciseTracker';
import type { WorkoutStats } from '@/hooks/useLiveExercise';
import { toast } from 'sonner';

export default function AlarmRinging() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alarms, logCompletion } = useFitnessAlarm();
  const { addEarnedTime, bank } = useScreenTimeBank();
  const [alarm, setAlarm] = useState<any>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isAlarmMuted, setIsAlarmMuted] = useState(false);
  const completedRef = useRef(false);

  const { play: playAlarm, stop: stopAlarm } = useAlarmAudio(alarm?.alarm_sound || 'classic');

  async function handleAlarmComplete(stats: WorkoutStats) {
    if (completedRef.current || !alarm || !startTime) return;
    completedRef.current = true;

    const timeToComplete = Math.floor((Date.now() - startTime) / 1000);

    try {
      await logCompletion({
        alarm_id: alarm.id,
        push_ups_completed: stats.reps,
        time_to_complete: timeToComplete,
      });

      // Earn screen time from push-ups
      const pushUpsPerMinute = bank?.push_ups_per_minute || 5;
      const earnedMinutes = Math.floor(stats.reps / pushUpsPerMinute);
      if (earnedMinutes > 0) {
        await addEarnedTime({ pushUps: stats.reps });
      }

      stopAlarm();
      alarmStorageService.clearRingingAlarm();
      await Haptics.impact({ style: ImpactStyle.Heavy });
      
      const screenTimeMessage = earnedMinutes > 0 
        ? ` You earned ${earnedMinutes} min of screen time! 📱` 
        : '';
      toast.success(`Congratulations! ${stats.reps} push-ups completed!${screenTimeMessage} Have a great day! 🎉`, { duration: 4000 });
      
      setTimeout(() => {
        navigate('/fitness-alarm');
      }, 2000);
    } catch (error) {
      console.error('Failed to log completion:', error);
      toast.error('Failed to log alarm completion');
    }
  }

  function handleEndWorkout() {
    stopAlarm();
    alarmStorageService.clearRingingAlarm();
    navigate('/fitness-alarm');
  }

  // Load alarm data
  useEffect(() => {
    if (id && alarms) {
      const foundAlarm = alarms.find(a => a.id === id);
      setAlarm(foundAlarm);
    }
  }, [id, alarms]);

  // Start alarm audio and vibration
  useEffect(() => {
    if (!alarm) return;

    setStartTime(Date.now());

    // Start alarm sound
    if (!isAlarmMuted) {
      playAlarm();
    }

    // Vibration pattern
    const vibrate = async () => {
      try {
        await Haptics.vibrate({ duration: 500 });
        setTimeout(vibrate, 2000);
      } catch (e) {
        console.error('Vibration failed:', e);
      }
    };
    vibrate();

    return () => {
      stopAlarm();
    };
  }, [alarm, isAlarmMuted]);

  const toggleAlarmMute = () => {
    if (isAlarmMuted) {
      playAlarm();
    } else {
      stopAlarm();
    }
    setIsAlarmMuted(!isAlarmMuted);
  };

  if (!alarm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-safe">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading alarm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative pt-safe">
      {/* Alarm Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleAlarmMute}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isAlarmMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEndWorkout}
          className="bg-background/80 backdrop-blur-sm"
        >
          End Workout
        </Button>
      </div>

      {/* LiveExerciseTracker handles everything */}
      <LiveExerciseTracker
        alarmMode
        preSelectedExercise="pushups"
        targetRepsOverride={alarm.push_up_count}
        onAlarmComplete={handleAlarmComplete}
      />
    </div>
  );
}

