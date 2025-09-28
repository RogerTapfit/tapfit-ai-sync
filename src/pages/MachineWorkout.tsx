import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MachineRegistryService } from '@/services/machineRegistryService';
import { useWeightRecommendation } from '@/hooks/useWeightRecommendation';
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger';
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Info, 
  Settings, 
  Dumbbell, 
  CheckCircle, 
  Clock, 
  Target, 
  Weight, 
  Edit3,
  Play
} from 'lucide-react';

interface WorkoutSet {
  id: number;
  reps: number;
  weight: number;
  completed: boolean;
  actualReps?: number;
  actualWeight?: number;
}

export default function MachineWorkout() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logExercise, currentWorkoutLog, startWorkout } = useWorkoutLogger();
  
  const machine = workoutId ? MachineRegistryService.getMachineByWorkoutId(workoutId) : null;
  
  // Workout state
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  
  // Get personalized weight recommendations
  const { 
    recommendation, 
    loading: recommendationLoading, 
    getConfidenceColor, 
    getConfidenceDescription 
  } = useWeightRecommendation({
    exerciseName: machine?.type || 'chest_press',
    machineName: machine?.name || '',
    muscleGroup: machine?.muscleGroup || 'chest'
  });

  // Initialize sets when machine and recommendation are loaded
  useEffect(() => {
    if (machine && recommendation && !recommendationLoading) {
      initializeSets();
    }
  }, [machine, recommendation, recommendationLoading]);

  // Ensure we have an active workout session
  useEffect(() => {
    const ensureWorkoutSession = async () => {
      if (machine && !currentWorkoutLog) {
        console.log('No active workout session, starting one for machine workout');
        await startWorkout(
          `${machine.muscleGroup} Workout`,
          machine.muscleGroup,
          8 // Default total exercises for a muscle group workout
        );
      }
    };

    ensureWorkoutSession();
  }, [machine, currentWorkoutLog, startWorkout]);

  // Rest timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      // Play countdown beeps at 10, 5, 4, 3, 2, 1 seconds
      if ([10, 5, 4, 3, 2, 1].includes(restTime)) {
        import('@/utils/audioUtils').then(({ audioManager }) => {
          audioManager.playCountdownBeep();
        });
      }

      timer = setTimeout(() => {
        setRestTime(restTime - 1);
      }, 1000);
    } else if (isResting && restTime === 0) {
      setIsResting(false);
      // Play rest complete sound
      import('@/utils/audioUtils').then(async ({ audioManager }) => {
        await audioManager.playRestComplete();
      });
      toast.success("Rest time complete! Ready for next set");
    }
    return () => clearTimeout(timer);
  }, [isResting, restTime]);

  const initializeSets = () => {
    if (!machine || !recommendation) return;
    
    const newSets: WorkoutSet[] = [];
    for (let i = 0; i < (recommendation.sets || 3); i++) {
      newSets.push({
        id: i + 1,
        reps: recommendation.reps || 12,
        weight: 0,
        completed: false,
        actualReps: recommendation.reps || 12,
        actualWeight: recommendation.recommended_weight || 80
      });
    }
    setSets(newSets);
  };

  const handleStartWorkout = async () => {
    setWorkoutStarted(true);
    setWorkoutStartTime(new Date());
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playButtonClick();
    toast.success('Workout started! Complete each set when ready.');
  };

  const handleSetComplete = async (setIndex: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex].completed = true;
    setSets(updatedSets);

    // Play set completion sound
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playSetComplete();
    
    // Check for progress milestones
    const newCompletedSets = updatedSets.filter(set => set.completed).length;
    const totalSets = sets.length;
    const newProgress = (newCompletedSets / totalSets) * 100;
    
    if (newProgress === 25 || newProgress === 50 || newProgress === 75) {
      setTimeout(async () => {
        await audioManager.playProgressMilestone(newProgress);
      }, 200);
    } else if (newProgress === 100) {
      setTimeout(async () => {
        await audioManager.playWorkoutComplete();
      }, 300);
      // Auto-complete workout after short delay
      setTimeout(() => {
        handleWorkoutComplete();
      }, 2000);
      return;
    }

    // Start rest timer if not the last set
    if (newCompletedSets < totalSets) {
      setRestTime(recommendation?.rest_seconds || 60);
      setIsResting(true);
    }

    toast.success(`Set ${setIndex + 1} completed!`);
  };

  const handleSetEdit = (setIndex: number, field: 'actualReps' | 'actualWeight', value: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex][field] = value;
    setSets(updatedSets);
  };

  const saveProgress = async () => {
    if (!currentWorkoutLog || !machine) return;

    const totalReps = sets.reduce((sum, set) => sum + (set.actualReps || 0), 0);
    const completedSets = sets.filter(s => s.completed).length;
    
    if (completedSets > 0) {
      await logExercise(
        currentWorkoutLog.id,
        machine.name,
        machine.name,
        completedSets,
        totalReps,
        sets[0]?.actualWeight
      );
    }
  };

  if (!machine) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Machine not found</p>
            <Button onClick={() => navigate('/workout-list')} className="mt-4">
              Back to Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map scanned machine names to workout list names
  const mapMachineNameToWorkoutName = (machineName: string): string => {
    const nameMapping: { [key: string]: string } = {
      // Chest machines
      'Chest Press Machine': 'Chest Press Machine',
      'Pec Deck': 'Pec Deck (Butterfly) Machine',
      'Butterfly Machine': 'Pec Deck (Butterfly) Machine',
      'Incline Press': 'Incline Chest Press Machine',
      'Incline Chest Press': 'Incline Chest Press Machine',
      'Decline Press': 'Decline Chest Press Machine',
      'Decline Chest Press': 'Decline Chest Press Machine',
      'Cable Crossover': 'Cable Crossover Machine',
      'Smith Machine': 'Smith Machine (Flat Bench Press setup)',
      'Dip Machine': 'Seated Dip Machine (Chest-focused variant)',
      'Assisted Dips': 'Assisted Chest Dips Machine',
      // Legs machines
      'Leg Extension Machine': 'Leg Extension Machine',
      'Leg Extension': 'Leg Extension Machine',
      'Leg Lift Machine': 'Leg Extension Machine',
      'Leg Press Machine': 'Leg Press Machine',
      'Leg Press': 'Leg Press Machine',
      // Back machines
      'Lat Pulldown Machine': 'Lat Pulldown Machine',
      'Lat Pulldown': 'Lat Pulldown Machine',
      'Seated Row Machine': 'Seated Row Machine',
      'Seated Row': 'Seated Row Machine',
      // Shoulders machines
      'Shoulder Press Machine': 'Shoulder Press Machine',
      'Shoulder Press': 'Shoulder Press Machine'
    };
    
    // Try exact match first
    if (nameMapping[machineName]) {
      return nameMapping[machineName];
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(nameMapping)) {
      if (machineName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(machineName.toLowerCase())) {
        return value;
      }
    }
    
    return machineName; // Return original if no mapping found
  };

  const handleWorkoutComplete = async () => {
    if (!currentWorkoutLog || !machine) {
      console.error('Missing workout log or machine data');
      return;
    }

    const completedSets = sets.filter(s => s.completed).length;
    const totalReps = sets.reduce((sum, set) => sum + (set.actualReps || 0), 0);
    const avgWeight = sets.length > 0 ? 
      Math.round(sets.reduce((sum, set) => sum + (set.actualWeight || 0), 0) / sets.length) : 0;
    
    // Calculate total weight lifted
    const totalWeightLifted = sets
      .filter(set => set.completed)
      .reduce((sum, set) => sum + ((set.actualWeight || 0) * (set.actualReps || 0)), 0);
    
    // Calculate workout duration in minutes
    const duration = workoutStartTime 
      ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / (1000 * 60))
      : 0;

    // Map machine name to workout list name for consistency
    const workoutName = mapMachineNameToWorkoutName(machine.name);
    
    console.log('Logging final exercise completion:', {
      workoutLogId: currentWorkoutLog.id,
      exerciseName: workoutName,
      machineName: machine.name,
      sets: completedSets,
      reps: totalReps,
      weight: avgWeight
    });
    
    // Log the exercise completion with actual workout data
    const success = await logExercise(
      currentWorkoutLog.id,
      workoutName,
      machine.name,
      completedSets,
      totalReps,
      avgWeight
    );

    if (success) {
      toast.success('Exercise completed and saved!');
      navigate('/workout-summary', { 
        state: { 
          workoutData: {
            name: workoutName,
            exercises: 1,
            duration: duration,
            sets: completedSets,
            totalReps: totalReps,
            totalWeightLifted: totalWeightLifted,
            notes: notes,
            allWorkoutsCompleted: false
          }
        }
      });
    } else {
      toast.error('Failed to save workout progress');
    }
  };

  const handleBackToList = async () => {
    await saveProgress();
    navigate('/workout-list', { state: { fromWorkoutDetail: true } });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !machine) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 animate-spin text-primary rounded-full border-2 border-primary border-t-transparent" />
          <p>Loading machine...</p>
        </div>
      </div>
    );
  }

  const completedSets = sets.filter(s => s.completed).length;
  const totalSets = sets.length;
  const exerciseProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // Dynamic progress bar gradient color based on percentage
  const getProgressGradient = (percentage: number) => {
    if (percentage <= 50) {
      const ratio = percentage / 50;
      const red = 255;
      const green = Math.round(255 * ratio);
      return `rgb(${red}, ${green}, 0)`;
    } else {
      const ratio = (percentage - 50) / 50;
      const red = Math.round(255 * (1 - ratio));
      const green = 255;
      return `rgb(${red}, ${green}, 0)`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="container max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{machine.name}</h1>
            <p className="text-sm text-muted-foreground">{machine.muscleGroup}</p>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Rest Timer Card */}
        {isResting && (
          <Card className="border-orange-500 bg-orange-500/10">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                {formatTime(restTime)}
              </div>
              <p className="text-sm text-muted-foreground">Rest time remaining</p>
            </CardContent>
          </Card>
        )}

        {/* Exercise Progress */}
        {workoutStarted && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Exercise Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Sets Completed</span>
                  <span>{completedSets}/{totalSets}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${exerciseProgress}%`,
                      backgroundColor: getProgressGradient(exerciseProgress)
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold" style={{ color: getProgressGradient(exerciseProgress) }}>
                    {Math.round(exerciseProgress)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Machine Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Machine Image */}
            <Card>
              <CardContent className="p-4">
                {(location.state?.aiSelectedImageUrl || machine.imageUrl) && (
                  <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={location.state?.fromScan && location.state?.aiSelectedImageUrl 
                        ? location.state.aiSelectedImageUrl 
                        : machine.imageUrl
                      } 
                      alt={machine.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Machine Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge variant="secondary">{machine.muscleGroup}</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Target Sets:</span>
                    <span className="text-sm">{recommendation?.sets || 3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Reps per Set:</span>
                    <span className="text-sm">{recommendation?.reps || 12}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Rest Time:</span>
                    <span className="text-sm">{recommendation?.rest_seconds || 60}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weight Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Recommended Weight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendationLoading ? (
                  <div className="text-center text-muted-foreground">
                    Calculating...
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {recommendation?.recommended_weight || 80} lbs
                      </div>
                      <div className={`text-sm ${getConfidenceColor(recommendation?.confidence || 'learning')}`}>
                        {getConfidenceDescription(recommendation?.confidence || 'learning')}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      Based on your profile and experience level
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Follow proper form and controlled movements. Start with a comfortable weight and focus on technique.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Workout Interface */}
          <div className="lg:col-span-2">
            {!workoutStarted ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Ready to Start?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Get ready to perform {recommendation?.sets || 3} sets of {recommendation?.reps || 12} reps.
                    </p>
                    <Button 
                      onClick={handleStartWorkout}
                      size="lg"
                      className="w-full"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sets.map((set, index) => (
                  <Card key={set.id} className={`${set.completed ? 'bg-green-500/10 border-green-500' : 'bg-card'}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {set.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                          )}
                          Set {set.id}
                        </span>
                        {set.completed && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                            Complete
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Reps
                          </label>
                          <Input
                            type="number"
                            value={set.actualReps}
                            onChange={(e) => handleSetEdit(index, 'actualReps', parseInt(e.target.value) || 0)}
                            disabled={set.completed}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Weight className="h-4 w-4" />
                            Weight (lbs)
                          </label>
                          <Input
                            type="number"
                            value={set.actualWeight}
                            onChange={(e) => handleSetEdit(index, 'actualWeight', parseInt(e.target.value) || 0)}
                            disabled={set.completed}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {!set.completed && (
                        <Button 
                          onClick={() => handleSetComplete(index)}
                          className="w-full"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Set {set.id}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5" />
                      Workout Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add any notes about this workout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </CardContent>
                </Card>

                {/* Complete Workout Button */}
                {completedSets === totalSets && totalSets > 0 && (
                  <Card className="border-green-500 bg-green-500/10">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Excellent Work!</h3>
                      <p className="text-muted-foreground mb-4">
                        You've completed all sets. Great job!
                      </p>
                      <Button 
                        onClick={handleWorkoutComplete}
                        size="lg"
                        className="w-full"
                      >
                        Complete Workout
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}