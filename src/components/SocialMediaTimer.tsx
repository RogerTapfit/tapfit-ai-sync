import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useScreenTimeBank, PLATFORM_CONFIG, Platform } from '@/hooks/useScreenTimeBank';
import { X, Play, Pause, ExternalLink, AlertTriangle } from 'lucide-react';

interface SocialMediaTimerProps {
  platform: Platform;
  availableMinutes: number;
  onClose: () => void;
}

export const SocialMediaTimer = ({ platform, availableMinutes, onClose }: SocialMediaTimerProps) => {
  const { startSession, endSession } = useScreenTimeBank();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(availableMinutes * 60);
  const [secondsUsed, setSecondsUsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = PLATFORM_CONFIG[platform];

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          const newValue = prev - 1;
          
          // Show warning at 5 minutes
          if (newValue === 300 && !showWarning) {
            setShowWarning(true);
            // Try to vibrate if available
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
          
          // Show warning at 1 minute
          if (newValue === 60) {
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500]);
            }
          }
          
          return newValue;
        });
        setSecondsUsed((prev) => prev + 1);
      }, 1000);
    } else if (secondsRemaining <= 0) {
      handleTimeUp();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsRemaining]);

  const handleStart = async () => {
    try {
      const session = await startSession({ platform });
      setSessionId(session.id);
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleStop = async () => {
    setIsRunning(false);
    if (sessionId && secondsUsed > 0) {
      const minutesUsed = Math.ceil(secondsUsed / 60);
      await endSession({ sessionId, minutesUsed });
    }
    onClose();
  };

  const handleTimeUp = async () => {
    setIsRunning(false);
    if ('vibrate' in navigator) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }
    
    if (sessionId) {
      const minutesUsed = Math.ceil(secondsUsed / 60);
      await endSession({ sessionId, minutesUsed });
    }
  };

  const handleOpenApp = () => {
    if (config.url) {
      window.open(config.url, '_blank');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (secondsRemaining / (availableMinutes * 60)) * 100;
  const isLowTime = secondsRemaining <= 300; // 5 minutes

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${secondsRemaining <= 0 ? 'border-red-500 animate-pulse' : ''}`}>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <span className="font-bold text-xl">{config.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleStop}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Timer Display */}
          <div className="text-center py-8">
            <div className={`text-7xl font-mono font-black ${isLowTime ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-muted-foreground mt-2">
              {secondsRemaining <= 0 ? "Time's up!" : 'remaining'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                isLowTime ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Warning Message */}
          {isLowTime && secondsRemaining > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">
                {secondsRemaining <= 60 ? 'Less than 1 minute left!' : 'Less than 5 minutes left!'}
              </p>
            </div>
          )}

          {/* Time's Up */}
          {secondsRemaining <= 0 && (
            <div className="text-center p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-lg font-bold text-red-500">⏰ Time's Up!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Do some push-ups to earn more screen time!
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!sessionId ? (
              <Button
                onClick={handleStart}
                className={`flex-1 h-14 text-lg bg-gradient-to-r ${config.color}`}
              >
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            ) : (
              <>
                {isRunning ? (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="flex-1 h-14 text-lg"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={handleResume}
                    className="flex-1 h-14 text-lg"
                    disabled={secondsRemaining <= 0}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </Button>
                )}
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="flex-1 h-14 text-lg"
                >
                  End Session
                </Button>
              </>
            )}
          </div>

          {/* Open App Button */}
          {config.url && sessionId && (
            <Button
              onClick={handleOpenApp}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open {config.name}
            </Button>
          )}

          {/* Stats */}
          <div className="flex justify-between text-sm text-muted-foreground pt-4 border-t border-border">
            <span>Time used: {formatTime(secondsUsed)}</span>
            <span>Session: {sessionId ? 'Active' : 'Not started'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
