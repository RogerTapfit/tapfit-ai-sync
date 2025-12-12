import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { LiveExerciseTracker } from './LiveExerciseTracker';
import { useScreenTimeBank } from '@/hooks/useScreenTimeBank';
import { X, Settings, Clock, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EarnScreenTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExchangeRate: number;
}

export function EarnScreenTimeModal({ isOpen, onClose, initialExchangeRate }: EarnScreenTimeModalProps) {
  const [currentReps, setCurrentReps] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate);
  const [workoutEnded, setWorkoutEnded] = useState(false);
  
  const { addEarnedTime, updateExchangeRate } = useScreenTimeBank();

  // Calculate earned minutes in real-time
  const minutesEarned = Math.floor(currentReps / exchangeRate);
  const progressToNextMinute = currentReps % exchangeRate;
  const progressPercent = (progressToNextMinute / exchangeRate) * 100;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentReps(0);
      setWorkoutEnded(false);
      setExchangeRate(initialExchangeRate);
    }
  }, [isOpen, initialExchangeRate]);

  const handleRepUpdate = (reps: number) => {
    setCurrentReps(reps);
  };

  const handleWorkoutComplete = async () => {
    if (currentReps > 0) {
      await addEarnedTime({ pushUps: currentReps });
    }
    setWorkoutEnded(true);
  };

  const handleSaveExchangeRate = async () => {
    await updateExchangeRate({ pushUpsPerMinute: exchangeRate });
    setShowSettings(false);
    toast.success('Exchange rate updated!');
  };

  const handleClose = () => {
    if (currentReps > 0 && !workoutEnded) {
      // Auto-save earned time if user closes without ending workout
      addEarnedTime({ pushUps: currentReps });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header - safe area aware */}
      <div className="sticky z-10 bg-background/80 backdrop-blur-lg border-b border-border safe-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold">Earn Screen Time</h1>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Minutes Display */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-green-500">
                  +{minutesEarned} min
                </div>
                <p className="text-xs text-muted-foreground">
                  {progressToNextMinute}/{exchangeRate} to next minute
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{currentReps}</div>
              <p className="text-xs text-muted-foreground">push-ups</p>
            </div>
          </div>
          
          {/* Progress to next minute */}
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mx-4 mt-4 border-primary/30">
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Push-ups per minute: {exchangeRate}
              </label>
              <Slider
                value={[exchangeRate]}
                onValueChange={(v) => setExchangeRate(v[0])}
                min={1}
                max={20}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Currently: {exchangeRate} push-ups = 1 minute of screen time
              </p>
            </div>
            <Button onClick={handleSaveExchangeRate} size="sm" className="w-full">
              Save Exchange Rate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exercise Tracker */}
      <div className="flex-1 overflow-auto p-4">
        <LiveExerciseTracker
          preSelectedExercise="pushups"
          screenTimeMode
          onRepUpdate={handleRepUpdate}
          onScreenTimeComplete={handleWorkoutComplete}
        />
      </div>
    </div>
  );
}
