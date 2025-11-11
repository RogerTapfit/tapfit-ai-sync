import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getCurrentPuck, connectNearest, type BlePairCallbacks } from '@/lib/blePair';
import { toast } from 'sonner';
import { Activity, Bluetooth, Battery, Timer, Target } from 'lucide-react';
import { useWorkoutAudio } from '@/hooks/useWorkoutAudio';
import { getCoachingPhrase } from '@/services/workoutVoiceCoaching';

interface RealTimeRepCounterProps {
  targetReps?: number;
  targetSets?: number;
  onWorkoutComplete?: () => void;
}

export function RealTimeRepCounter({ 
  targetReps = 10, 
  targetSets = 3,
  onWorkoutComplete 
}: RealTimeRepCounterProps) {
  const [repCount, setRepCount] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  
  const { speak } = useWorkoutAudio();

  // Timer for workout duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && !isResting) {
      interval = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isResting]);

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setIsResting(false);
            const restCompletePhrase = getCoachingPhrase({ type: 'rest_countdown', data: { restTimeLeft: 0 } });
            speak(restCompletePhrase || 'Rest complete! Start next set', 'high');
            toast.success('Rest complete! Start next set');
            return 0;
          }
          
          // Voice coaching during rest
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
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const callbacks: BlePairCallbacks = {
    onStatusUpdate: (status) => {
      setConnectionStatus(status);
      if (status.includes('Connected')) {
        toast.success('Puck connected successfully!');
      }
    },
    onRepCountUpdate: (count) => {
      setRepCount(count);
      
      // Check if set is complete
      if (count >= targetReps && !isResting) {
        if (currentSet < targetSets) {
          const setCompletePhrase = getCoachingPhrase({ type: 'set_complete' });
          speak(setCompletePhrase || 'Set complete! Take a rest', 'high');
          toast.success(`Set ${currentSet} complete! Take a rest`);
          setCurrentSet(prev => prev + 1);
          setRepCount(0);
          setIsResting(true);
          setRestTime(60); // 60 second rest
          
          const restStartPhrase = getCoachingPhrase({ type: 'rest_start' });
          if (restStartPhrase) {
            speak(restStartPhrase, 'normal');
          }
        } else {
          const workoutCompletePhrase = getCoachingPhrase({ type: 'workout_complete' });
          speak(workoutCompletePhrase || 'Workout complete! Great job!', 'high');
          toast.success('Workout complete! Great job!');
          setSessionActive(false);
          onWorkoutComplete?.();
        }
      }
      
      // Milestone coaching
      const milestonePhrase = getCoachingPhrase({ 
        type: 'rep_milestone', 
        data: { currentReps: count, targetReps } 
      });
      if (milestonePhrase) {
        speak(milestonePhrase, 'normal');
      }
      
      // Near target encouragement
      if (count === targetReps - 2) {
        const nearTargetPhrase = getCoachingPhrase({ type: 'near_target' });
        if (nearTargetPhrase) {
          speak(nearTargetPhrase, 'normal');
        }
      }
    },
    onPuckStateUpdate: (state) => {
      if (state.batteryLevel !== undefined) {
        setBatteryLevel(state.batteryLevel);
      }
      if (state.sessionActive !== undefined) {
        setSessionActive(state.sessionActive);
      }
    },
    onConnectionSuccess: (puckClient) => {
      setConnectionStatus('Connected');
      setIsConnecting(false);
    },
    onConnectionFailed: (error) => {
      setConnectionStatus(`Failed: ${error}`);
      setIsConnecting(false);
      toast.error('Connection failed. Try again.');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('Connecting...');
    
    try {
      const result = await connectNearest(15000, callbacks);
      if (!result.success) {
        toast.error(result.error || 'Connection failed');
      }
    } catch (error) {
      toast.error('Connection error');
      setIsConnecting(false);
    }
  };

  const handleStartSession = async () => {
    const puck = getCurrentPuck();
    if (puck) {
      try {
        await puck.startSession();
        setSessionActive(true);
        setRepCount(0);
        setCurrentSet(1);
        setWorkoutTime(0);
        
        const workoutStartPhrase = getCoachingPhrase({ type: 'workout_start' });
        speak(workoutStartPhrase || 'Workout session started!', 'high');
        toast.success('Workout session started!');
      } catch (error) {
        toast.error('Failed to start session');
      }
    }
  };

  const handleEndSession = async () => {
    const puck = getCurrentPuck();
    if (puck) {
      try {
        await puck.endSession();
        setSessionActive(false);
        setIsResting(false);
        setRestTime(0);
        toast.success('Workout session ended');
      } catch (error) {
        toast.error('Failed to end session');
      }
    }
  };

  const handleCalibrateNow = async () => {
    const puck = getCurrentPuck();
    if (puck) {
      try {
        await puck.calibrate();
        toast.success('Calibration started');
      } catch (error) {
        toast.error('Calibration failed');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (repCount / targetReps) * 100;
  const overallProgress = ((currentSet - 1) * targetReps + repCount) / (targetSets * targetReps) * 100;

  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bluetooth className="h-5 w-5" />
            Puck Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={connectionStatus.includes('Connected') ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
            {batteryLevel !== null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Battery className="h-4 w-4" />
                {batteryLevel}%
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {!connectionStatus.includes('Connected') && (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                size="sm"
              >
                {isConnecting ? 'Connecting...' : 'Connect Puck'}
              </Button>
            )}
            
            {connectionStatus.includes('Connected') && (
              <>
                <Button 
                  onClick={handleCalibrateNow}
                  variant="outline"
                  size="sm"
                >
                  Calibrate
                </Button>
                
                {!sessionActive ? (
                  <Button 
                    onClick={handleStartSession}
                    size="sm"
                  >
                    Start Workout
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEndSession}
                    variant="destructive"
                    size="sm"
                  >
                    End Workout
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rep Counter Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rep Counter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Set Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Set {currentSet} of {targetSets}</span>
              <span className="text-sm text-muted-foreground">
                {repCount} / {targetReps} reps
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Large Rep Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary">
              {repCount}
            </div>
            <div className="text-lg text-muted-foreground">
              {isResting ? `Rest: ${formatTime(restTime)}` : 'Reps'}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Workout Stats */}
          {sessionActive && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  Time
                </div>
                <div className="text-lg font-semibold">
                  {formatTime(workoutTime)}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  Target
                </div>
                <div className="text-lg font-semibold">
                  {targetSets} × {targetReps}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rest Timer Card */}
      {isResting && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                Rest Time
              </div>
              <div className="text-4xl font-bold text-orange-500 mt-2">
                {formatTime(restTime)}
              </div>
              <div className="text-sm text-orange-600 mt-2">
                Prepare for set {currentSet}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}