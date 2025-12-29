import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Timer, 
  TrendingUp,
  Gauge,
  CheckCircle,
  RotateCcw,
  Activity
} from 'lucide-react';
import { Machine } from '@/types/machine';
import { supabase } from '@/integrations/supabase/client';

interface RopeTrainerWorkoutProps {
  machine: Machine;
  onBack: () => void;
  onComplete: (data: RopeTrainerResult) => void;
  workoutLogId?: string;
}

export interface RopeTrainerResult {
  duration_seconds: number;
  resistance_level: number;
  distance_meters?: number;
  notes: string;
}

export const RopeTrainerWorkout: React.FC<RopeTrainerWorkoutProps> = ({
  machine,
  onBack,
  onComplete,
  workoutLogId
}) => {
  // Workout state
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [resistanceLevel, setResistanceLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = new Date();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
          setElapsedTime(pausedTimeRef.current + elapsed);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        pausedTimeRef.current = elapsedTime;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (isActive) {
      setIsActive(false);
      toast.info('Workout paused');
    } else {
      setIsActive(true);
      toast.success('Rope trainer started!');
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setElapsedTime(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
    toast.info('Timer reset');
  };

  const handleComplete = async () => {
    if (elapsedTime < 10) {
      toast.error('Please complete at least 10 seconds of exercise');
      return;
    }

    setIsActive(false);
    setIsSaving(true);

    try {
      // Log to exercise_logs with special handling for rope trainer
      if (workoutLogId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Log as exercise with duration in notes and resistance as "weight"
          await supabase
            .from('exercise_logs')
            .insert({
              workout_log_id: workoutLogId,
              user_id: user.id,
              exercise_name: 'Rope Pull',
              machine_name: machine.name,
              sets_completed: 1, // Rope trainer is typically one continuous effort
              reps_completed: Math.floor(elapsedTime), // Store seconds as "reps" for tracking
              weight_used: resistanceLevel * 10, // Store level * 10 as weight (for display purposes)
              notes: `Duration: ${formatTime(elapsedTime)} | Level: ${resistanceLevel}/7 | ${notes}`.trim()
            });
        }
      }

      setIsCompleted(true);
      
      const result: RopeTrainerResult = {
        duration_seconds: elapsedTime,
        resistance_level: resistanceLevel,
        notes
      };

      toast.success(`Rope trainer complete! ${formatTime(elapsedTime)} at Level ${resistanceLevel}`);
      onComplete(result);
    } catch (error) {
      console.error('Error saving rope trainer workout:', error);
      toast.error('Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  const getIntensityLabel = (level: number) => {
    if (level <= 2) return 'Light';
    if (level <= 4) return 'Moderate';
    if (level <= 5) return 'Challenging';
    return 'Intense';
  };

  const getIntensityColor = (level: number) => {
    if (level <= 2) return 'text-green-500';
    if (level <= 4) return 'text-yellow-500';
    if (level <= 5) return 'text-orange-500';
    return 'text-red-500';
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
            <p className="text-muted-foreground mb-4">
              {formatTime(elapsedTime)} at Level {resistanceLevel}
            </p>
            <Button onClick={onBack} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{machine.name}</h1>
            <p className="text-sm text-muted-foreground">Functional Training</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Timer Display */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground uppercase tracking-wide">Duration</span>
              </div>
              <div className="text-6xl font-mono font-bold text-primary mb-4">
                {formatTime(elapsedTime)}
              </div>
              
              {/* Timer Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  variant={isActive ? "destructive" : "default"}
                  onClick={handleStartPause}
                  className="w-32"
                >
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      {elapsedTime > 0 ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>
                
                {elapsedTime > 0 && !isActive && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resistance Level Selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5" />
              Resistance Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Level Display */}
              <div className="flex justify-between items-center">
                <span className="text-4xl font-bold">{resistanceLevel}</span>
                <div className="text-right">
                  <Badge variant="outline" className={getIntensityColor(resistanceLevel)}>
                    {getIntensityLabel(resistanceLevel)}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">of 7</p>
                </div>
              </div>
              
              {/* Level Slider */}
              <div className="py-2">
                <Slider
                  value={[resistanceLevel]}
                  onValueChange={(value) => setResistanceLevel(value[0])}
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 (Easy)</span>
                  <span>4</span>
                  <span>7 (Max)</span>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-7 gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={resistanceLevel === level ? "default" : "outline"}
                    onClick={() => setResistanceLevel(level)}
                    className="h-10"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Progress Indicator */}
        {elapsedTime > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{resistanceLevel}/7</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
              </div>
              
              {/* Intensity Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Intensity</span>
                  <span className={getIntensityColor(resistanceLevel)}>
                    {Math.round((resistanceLevel / 7) * 100)}%
                  </span>
                </div>
                <Progress value={(resistanceLevel / 7) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add notes about your rope trainer session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>

        {/* Complete Button */}
        {elapsedTime >= 10 && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleComplete}
            disabled={isSaving}
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Workout
              </>
            )}
          </Button>
        )}

        {/* Tip */}
        <div className="text-center text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 inline mr-1" />
          Tip: Increase resistance level to progress your training
        </div>
      </div>
    </div>
  );
};
