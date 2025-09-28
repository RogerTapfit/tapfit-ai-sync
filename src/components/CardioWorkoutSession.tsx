import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Play, Pause, Square, Timer, Target, Zap, TrendingUp } from 'lucide-react';
import { useCardioWorkout } from '@/hooks/useCardioWorkout';
import { CardioPrescriptionService } from '@/services/cardioPrescriptionService';
import { CardioMachineType, CardioGoal, HeartRateZone } from '@/types/cardio';

interface CardioWorkoutSessionProps {
  machineType: CardioMachineType;
  goal?: CardioGoal;
  targetZone?: HeartRateZone;
  duration?: number;
  onComplete?: () => void;
}

export function CardioWorkoutSession({ 
  machineType, 
  goal = 'endurance', 
  targetZone = 'Z2',
  duration = 30,
  onComplete 
}: CardioWorkoutSessionProps) {
  const {
    currentSession,
    currentBlocks,
    activeBlockIndex,
    elapsedTime,
    blockElapsedTime,
    isSessionActive,
    machineSettings,
    userProfile,
    shouldAdjustIntensity,
    connected,
    bpm,
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    getCurrentBlock,
    getHeartRateTarget,
    formatTime
  } = useCardioWorkout();

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCreateSession = async () => {
    if (!userProfile) {
      alert('Please complete your profile setup first');
      return;
    }

    setIsCreatingSession(true);
    try {
      const prescription = CardioPrescriptionService.generatePrescription(
        machineType,
        goal,
        duration * 2, // TRIMP target
        targetZone,
        userProfile,
        duration
      );

      const sessionId = await createSession(prescription);
      if (sessionId) {
        console.log('Session created:', sessionId);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleComplete = async () => {
    await completeSession();
    onComplete?.();
  };

  const currentBlock = getCurrentBlock();
  const hrTarget = getHeartRateTarget();
  const totalDuration = currentBlocks.reduce((sum, block) => sum + block.duration_min * 60, 0);
  
  // Calculate progress
  const sessionProgress = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0;
  const blockProgress = currentBlock ? (blockElapsedTime / (currentBlock.duration_min * 60)) * 100 : 0;

  // Heart rate zone calculation
  const getHeartRateZone = (bpm: number): string => {
    if (!userProfile || !bpm) return 'N/A';
    const hrr = (bpm - userProfile.HR_rest) / (userProfile.HR_max - userProfile.HR_rest);
    if (hrr < 0.60) return 'Z1';
    if (hrr < 0.70) return 'Z2';
    if (hrr < 0.80) return 'Z3';
    if (hrr < 0.90) return 'Z4';
    return 'Z5';
  };

  const getZoneColor = (zone: string): string => {
    const colors = {
      'Z1': 'bg-blue-500',
      'Z2': 'bg-green-500', 
      'Z3': 'bg-yellow-500',
      'Z4': 'bg-orange-500',
      'Z5': 'bg-red-500',
      'N/A': 'bg-gray-400'
    };
    return colors[zone as keyof typeof colors] || 'bg-gray-400';
  };

  const getMachineDisplaySettings = () => {
    switch (machineType) {
      case 'treadmill':
        return `${machineSettings.speed_kmh?.toFixed(1) || '5.0'} km/h, ${machineSettings.incline_pct?.toFixed(1) || '0.0'}% incline`;
      case 'bike':
        return machineSettings.watts ? `${machineSettings.watts}W` : `Level ${machineSettings.resistance_level || 5}`;
      case 'stair_stepper':
        return `${machineSettings.steps_per_min || 80} steps/min, Level ${machineSettings.level || 4}`;
      case 'elliptical':
        return `Resistance ${machineSettings.resistance || 5}`;
      case 'rower':
        return `Resistance ${machineSettings.resistance || 5}, ${machineSettings.stroke_rate || 24} SPM`;
      default:
        return 'Standard settings';
    }
  };

  if (!currentSession) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cardio Workout Setup</CardTitle>
          <CardDescription>
            Create a personalized {machineType} workout with real-time heart rate guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Machine</label>
              <Badge variant="outline" className="w-full justify-center py-2">
                {machineType.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal</label>
              <Badge variant="secondary" className="w-full justify-center py-2">
                {goal.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Zone</label>
              <Badge variant="secondary" className="w-full justify-center py-2">
                {targetZone}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Badge variant="secondary" className="w-full justify-center py-2">
                {duration} min
              </Badge>
            </div>
          </div>

          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription>
              {connected 
                ? "Apple Watch connected. Heart rate monitoring ready."
                : "Connect your Apple Watch for real-time heart rate guidance and adaptive intensity control."
              }
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleCreateSession} 
            disabled={isCreatingSession || !userProfile}
            className="w-full"
            size="lg"
          >
            {isCreatingSession ? "Creating Workout..." : "Create Personalized Workout"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {currentBlock?.block_type.toUpperCase()} - {formatTime(elapsedTime)}
          </CardTitle>
          <CardDescription>
            Block {activeBlockIndex + 1} of {currentBlocks.length} • {getMachineDisplaySettings()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Session Progress</span>
              <span>{Math.round(sessionProgress)}%</span>
            </div>
            <Progress value={sessionProgress} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Block</span>
              <span>{Math.round(blockProgress)}%</span>
            </div>
            <Progress value={blockProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Heart Rate Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connected && bpm ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-500">{bpm}</div>
                  <div className="text-sm text-muted-foreground">BPM</div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getZoneColor(getHeartRateZone(bpm))}`} />
                  <span className="text-sm font-medium">Zone {getHeartRateZone(bpm)}</span>
                </div>
                {hrTarget && (
                  <div className="text-center text-sm text-muted-foreground">
                    Target: {hrTarget.hr_bpm_min}-{hrTarget.hr_bpm_max} BPM
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Connect Apple Watch for heart rate monitoring</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current Block
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentBlock ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{currentBlock.block_type.toUpperCase()}</span>
                  <Badge variant="outline">
                    {formatTime(blockElapsedTime)} / {formatTime(currentBlock.duration_min * 60)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {Math.round(currentBlock.target_hrr_min * 100)}-{Math.round(currentBlock.target_hrr_max * 100)}% HRR
                </div>
                {shouldAdjustIntensity && (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Heart rate outside target range. Adjusting intensity automatically.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No active block</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center gap-4">
            {!isSessionActive && elapsedTime === 0 && (
              <Button onClick={startSession} size="lg" className="px-8">
                <Play className="mr-2 h-4 w-4" />
                Start Workout
              </Button>
            )}
            
            {isSessionActive && (
              <Button onClick={pauseSession} variant="outline" size="lg">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            
            {!isSessionActive && elapsedTime > 0 && (
              <Button onClick={resumeSession} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            
            {elapsedTime > 0 && (
              <Button onClick={handleComplete} variant="destructive" size="lg">
                <Square className="mr-2 h-4 w-4" />
                Complete Workout
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Block Preview */}
      {activeBlockIndex < currentBlocks.length - 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Next Block
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span>{currentBlocks[activeBlockIndex + 1]?.block_type.toUpperCase()}</span>
              <span>{currentBlocks[activeBlockIndex + 1]?.duration_min} minutes</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}