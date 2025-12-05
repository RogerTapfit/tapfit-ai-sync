import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MachineRegistryService } from '@/services/machineRegistryService';
import { getMachineImageUrl } from '@/utils/machineImageUtils';
import { useWeightRecommendation } from '@/hooks/useWeightRecommendation';
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger';
import { useMachineHistory } from '@/hooks/useMachineHistory';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useRestTimerLearning } from '@/hooks/useRestTimerLearning';
import { useWorkoutAudio } from '@/hooks/useWorkoutAudio';
import { getCoachingPhrase } from '@/services/workoutVoiceCoaching';
import { PRCelebration } from '@/components/PRCelebration';
import { toast } from "sonner";
import { usePageContext } from '@/hooks/usePageContext';
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
  Play,
  TrendingUp,
  Trophy,
  Plus,
  Brain,
  Timer
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
  const { logExercise, currentWorkoutLog, startWorkout, completeWorkout } = useWorkoutLogger();
  
  const machine = workoutId ? MachineRegistryService.getMachineByWorkoutId(workoutId) : null;

  // Register page context for chatbot
  usePageContext({
    pageName: `Machine Workout${machine ? ` - ${machine.name}` : ''}`,
    pageDescription: 'Active workout session on gym equipment with set/rep tracking and weight recommendations',
    visibleContent: machine ? `Working out on ${machine.name}. Track sets, reps, weight used, and rest times. AI recommends weights based on your history.` : 'Loading machine workout...'
  });
  
  // Workout state
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prData, setPRData] = useState<{ oldPR: number; newPR: number; improvement: number; coins: number } | null>(null);
  const [restStartTime, setRestStartTime] = useState<Date | null>(null);
  const [currentSetNumber, setCurrentSetNumber] = useState(0);
  
  // Get machine history for weight recommendations
  const { history: machineHistory, loading: historyLoading } = useMachineHistory(machine?.name || '');
  
  // Voice coaching
  const { speak } = useWorkoutAudio();
  
  // Handle PR voice coaching
  const handleNewPR = (prCheckResult: any) => {
    const prPhrase = getCoachingPhrase({ 
      type: 'personal_record', 
      data: { 
        improvementPercent: prCheckResult.improvement,
        exerciseName: prCheckResult.exerciseName || machine?.name || 'exercise'
      } 
    });
    if (prPhrase) {
      speak(prPhrase, 'high');
    }
  };
  
  // Get personal records tracking with PR callback
  const { currentPR, checkForNewPR } = usePersonalRecords(machine?.name || '', handleNewPR);
  
  // Get rest timer learning
  const { 
    restPreference, 
    calculateSuggestedRest, 
    updateRestPreference,
    manuallySetPreference
  } = useRestTimerLearning(machine?.name || '', machine?.name || '');
  
  // Get personalized weight recommendations
  const { 
    recommendation, 
    loading: recommendationLoading, 
    getConfidenceColor, 
    getConfidenceDescription 
  } = useWeightRecommendation({
    exerciseName: machine?.type || 'chest_press',
    machineName: machine?.name || '',
    muscleGroup: machine?.muscleGroup || 'chest',
    historicalWeight: machineHistory?.lastWeight // Pass historical weight!
  });

  // Initialize sets when machine and recommendation are loaded
  useEffect(() => {
    if (machine && recommendation && !recommendationLoading && !historyLoading) {
      initializeSets();
    }
  }, [machine, recommendation, recommendationLoading, historyLoading, machineHistory]);

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
    
    // Prioritize last used set count over recommendation
    const setCount = machineHistory?.lastSets || recommendation.sets || 3;
    
    // Smart weight selection: use progressive overload if ready, otherwise last weight, then recommendation
    const startingWeight = machineHistory?.shouldProgressWeight && machineHistory?.suggestedWeight
                           ? machineHistory.suggestedWeight  // Progressive overload! 
                           : machineHistory?.lastWeight || recommendation.recommended_weight || 80;
    
    const newSets: WorkoutSet[] = [];
    for (let i = 0; i < setCount; i++) {
      newSets.push({
        id: i + 1,
        reps: recommendation.reps || 12,
        weight: 0,
        completed: false,
        actualReps: recommendation.reps || 12,
        actualWeight: startingWeight
      });
    }
    setSets(newSets);
  };

  const handleStartWorkout = async () => {
    // Create workout session when user actually starts
    if (!currentWorkoutLog && machine) {
      console.log('Starting workout session for machine workout');
      await startWorkout(
        `${machine.muscleGroup} Workout`,
        machine.muscleGroup,
        8 // Default total exercises for a muscle group workout
      );
    }
    
    setWorkoutStarted(true);
    setWorkoutStartTime(new Date());
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playButtonClick();
    toast.success('Workout started! Complete each set when ready.');
  };

  const handleSetComplete = async (setIndex: number) => {
    // Track actual rest time taken if there was a previous rest period
    if (restStartTime && isResting) {
      const actualRestSeconds = Math.round((new Date().getTime() - restStartTime.getTime()) / 1000);
      await updateRestPreference(actualRestSeconds);
    }
    
    // Clear any active rest timer if user continues early  
    if (isResting) {
      setIsResting(false);
      setRestTime(0);
    }

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
      // Don't auto-complete - let user add more sets or finish manually
      return;
    }

    // Calculate smart rest time based on intensity
    if (newCompletedSets < totalSets) {
      const maxWeight = Math.max(...sets.map(s => s.actualWeight || 0));
      const currentWeight = sets[setIndex].actualWeight || 0;
      const suggestion = calculateSuggestedRest(
        currentWeight,
        maxWeight || currentPR?.weightLbs || currentWeight,
        setIndex + 1,
        totalSets
      );
      
      setRestTime(suggestion.suggestedRestSeconds);
      setIsResting(true);
      setRestStartTime(new Date());
      setCurrentSetNumber(setIndex + 1);
      
      // Show intelligent rest suggestion
      toast.success(`Set ${setIndex + 1} completed! Rest: ${suggestion.suggestedRestSeconds}s`, {
        description: suggestion.reason
      });
    } else {
      toast.success(`Set ${setIndex + 1} completed!`);
    }
  };

  const handleSetEdit = (setIndex: number, field: 'actualReps' | 'actualWeight', value: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex][field] = value;
    
    // AUTO-PROPAGATE WEIGHT: If editing Set 1's weight and no other sets are completed yet
    if (setIndex === 0 && field === 'actualWeight') {
      const anyOtherSetsCompleted = updatedSets.slice(1).some(set => set.completed);
      
      if (!anyOtherSetsCompleted) {
        // User is setting their working weight - apply to all uncompleted sets
        updatedSets.forEach((set, idx) => {
          if (!set.completed) {
            set.actualWeight = value;
          }
        });
        
        toast.success(`Weight updated to ${value} lbs for all sets`);
      }
    }
    
    setSets(updatedSets);
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: sets.length + 1,
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false,
      actualReps: lastSet.actualReps || recommendation?.reps || 12,
      actualWeight: lastSet.actualWeight || recommendation?.recommended_weight || 80
    };
    
    setSets([...sets, newSet]);
    
    // Play feedback sound
    import('@/utils/audioUtils').then(({ audioManager }) => {
      audioManager.playButtonClick();
    });
    
    toast.success(`Set ${newSet.id} added! Total sets: ${sets.length + 1}`);
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

    // Check for new PR
    if (success && avgWeight > 0) {
      const prResult = await checkForNewPR(
        machine.name,
        workoutName,
        avgWeight,
        totalReps,
        completedSets
      );

      if (prResult.isNewPR) {
        // Calculate coins based on improvement
        const improvement = prResult.improvement || 0;
        const coinsEarned = improvement >= 20 ? 100 : improvement >= 10 ? 50 : 25;
        
        setPRData({
          oldPR: prResult.oldPR || 0,
          newPR: prResult.newPR || avgWeight,
          improvement,
          coins: coinsEarned
        });
        setShowPRCelebration(true);
      }
    }

    if (success) {
      // Ensure the workout is fully completed before navigating
      try {
        await completeWorkout(currentWorkoutLog.id, duration, notes);
      } catch (e) {
        console.error('Failed to complete workout before summary:', e);
      }

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
            allWorkoutsCompleted: false,
            workoutLogId: currentWorkoutLog.id // Pass workout log ID for completion
          }
        }
      });
    } else {
      toast.error('Failed to save workout progress');
    }
  };

  const handleBackToList = async () => {
    // Check if workout has any exercises before navigating
    if (currentWorkoutLog) {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: exerciseLogs } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('workout_log_id', currentWorkoutLog.id);
      
      // Delete empty workout_logs to prevent clutter
      if (!exerciseLogs || exerciseLogs.length === 0) {
        await supabase
          .from('workout_logs')
          .delete()
          .eq('id', currentWorkoutLog.id);
        
        console.log('Deleted empty workout_log - no exercises were logged');
      } else {
        // Save progress if exercises were logged
        await saveProgress();
      }
    }
    
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
        {/* Smart Rest Timer - Non-blocking */}
        {isResting && (
          <div className="fixed top-4 right-4 z-50 w-72">
            <Card className="bg-background/95 backdrop-blur border-primary/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Smart Rest Timer</span>
                  </div>
                  {restPreference && restPreference.total_samples > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {restPreference.total_samples} sessions learned
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatTime(restTime)}
                </div>
                {(() => {
                  const maxWeight = Math.max(...sets.map(s => s.actualWeight || 0));
                  const currentSet = sets[currentSetNumber - 1];
                  const suggestion = currentSet ? calculateSuggestedRest(
                    currentSet.actualWeight || 0,
                    maxWeight || currentPR?.weightLbs || currentSet.actualWeight || 0,
                    currentSetNumber,
                    sets.length
                  ) : null;
                  
                  return suggestion && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {suggestion.reason}
                    </p>
                  );
                })()}
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => {
                      // Track actual rest taken
                      if (restStartTime) {
                        const actualRest = Math.round((new Date().getTime() - restStartTime.getTime()) / 1000);
                        updateRestPreference(actualRest);
                      }
                      setIsResting(false);
                      setRestTime(0);
                    }}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost" 
                    onClick={() => {
                      setIsResting(false);
                      setRestTime(0);
                    }}
                  >
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={
                      (location.state?.fromScan && location.state?.aiSelectedImageUrl) 
                        ? location.state.aiSelectedImageUrl 
                        : machine.imageUrl || getMachineImageUrl(machine.name || '')
                    } 
                    alt={machine.name || 'Exercise Machine'}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = getMachineImageUrl(machine.name || '');
                    }}
                  />
                </div>
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
                  {machineHistory ? 'Updated Weight' : 'Recommended Weight'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendationLoading || historyLoading ? (
                  <div className="text-center text-muted-foreground">
                    Calculating...
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {machineHistory?.shouldProgressWeight && machineHistory?.suggestedWeight
                          ? machineHistory.suggestedWeight
                          : machineHistory?.lastWeight || recommendation?.recommended_weight || 80} lbs
                      </div>
                      
                      {machineHistory?.shouldProgressWeight && machineHistory?.suggestedWeight && (
                        <Badge variant="default" className="mt-2 bg-green-500 hover:bg-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          ↑ {machineHistory.suggestedWeight - machineHistory.lastWeight} lbs
                        </Badge>
                      )}
                      
                      <div className={`text-sm mt-2 ${machineHistory ? 'text-primary font-medium' : getConfidenceColor(recommendation?.confidence || 'learning')}`}>
                        {machineHistory?.shouldProgressWeight
                          ? 'Progressive overload from last workout'
                          : machineHistory
                          ? 'Maintain from last workout'
                          : getConfidenceDescription(recommendation?.confidence || 'learning')}
                      </div>
                    </div>
                    
                    {!machineHistory && (
                      <div className="text-xs text-muted-foreground text-center">
                        Based on your profile and experience level
                      </div>
                    )}
                    
                    {/* Last Workout Reference - Secondary Info */}
                    {machineHistory && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span className="font-medium">Previous Workout</span>
                          </div>
                          <span>{new Date(machineHistory.lastWorkoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="text-sm font-medium text-foreground/80">
                          {machineHistory.lastSets} sets × {machineHistory.lastReps} reps @ {machineHistory.lastWeight} lbs
                        </div>
                      </div>
                    )}
                    
                    {/* Current PR Display */}
                    {currentPR && (
                      <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                            Current PR
                          </span>
                        </div>
                        <div className="text-lg font-bold">{currentPR.weightLbs} lbs</div>
                        <div className="text-xs text-muted-foreground">
                          {currentPR.sets} sets × {currentPR.reps} reps
                        </div>
                      </div>
                    )}
                    
                    {restPreference && restPreference.total_samples > 0 && (
                      <div className="text-xs text-center text-muted-foreground mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Timer className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            Your Rest Pattern
                          </span>
                        </div>
                        <div className="text-sm">
                          Avg rest: {restPreference.avg_actual_rest_seconds}s
                        </div>
                        <div className="text-xs mt-1 opacity-70">
                          Learned from {restPreference.total_samples} workouts
                        </div>
                      </div>
                    )}
                    
                    {machineHistory?.shouldProgressWeight && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1 text-primary">
                              Progressive Overload Opportunity! 🎯
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              You've completed all sets at {machineHistory.lastWeight} lbs for {machineHistory.consecutiveSuccessfulWorkouts} consecutive workouts. Time to level up!
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const updatedSets = sets.map(set => ({
                                    ...set,
                                    actualWeight: machineHistory.suggestedWeight || set.actualWeight
                                  }));
                                  setSets(updatedSets);
                                  toast.success(`Weight increased to ${machineHistory.suggestedWeight} lbs! 💪`);
                                }}
                                className="text-xs h-7"
                              >
                                Accept {machineHistory.suggestedWeight} lbs
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                (+{Math.round(((machineHistory.suggestedWeight || 0) - machineHistory.lastWeight) / machineHistory.lastWeight * 100)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                      Get ready to perform {sets.length} sets of {recommendation?.reps || 12} reps.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleStartWorkout}
                        size="lg"
                        className="w-full"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Start Workout
                      </Button>
                      <Button
                        onClick={handleAddSet}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Set ({sets.length} → {sets.length + 1})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4 relative">
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

                {/* Add Set Button - prominently displayed */}
                <div className="w-full py-4">
                  <Button
                    onClick={handleAddSet}
                    size="lg"
                    variant="destructive"
                    className="w-full h-14 text-lg font-semibold"
                    aria-label="Add Set"
                  >
                    Add Set
                  </Button>
                </div>

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
                    <CardContent className="p-6 text-center space-y-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <h3 className="text-lg font-semibold">Excellent Work!</h3>
                      <p className="text-muted-foreground">
                        You've completed all {sets.length} sets. Great job!
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={handleWorkoutComplete}
                          size="lg"
                          className="w-full"
                        >
                          Complete Workout
                        </Button>
                        <Button
                          onClick={handleAddSet}
                          variant="outline"
                          size="default"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add One More Set
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💪 Feeling strong? Add an extra set to increase volume!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Floating Action Button for Add Set */}
              <Button
                onClick={handleAddSet}
                size="lg"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
                title="Add another set"
              >
                <Plus className="h-6 w-6" />
              </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* PR Celebration Modal */}
      {prData && (
        <PRCelebration
          isVisible={showPRCelebration}
          machineName={machine.name}
          oldPR={prData.oldPR}
          newPR={prData.newPR}
          improvement={prData.improvement}
          coinsEarned={prData.coins}
          onClose={() => {
            setShowPRCelebration(false);
            toast.success('Exercise completed and saved!');
            navigate('/workout-summary', { 
              state: { 
                workoutData: {
                  name: mapMachineNameToWorkoutName(machine.name),
                  exercises: 1,
                  duration: workoutStartTime ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / (1000 * 60)) : 0,
                  sets: sets.filter(s => s.completed).length,
                  totalReps: sets.reduce((sum, set) => sum + (set.actualReps || 0), 0),
                  totalWeightLifted: sets.filter(set => set.completed).reduce((sum, set) => sum + ((set.actualWeight || 0) * (set.actualReps || 0)), 0),
                  notes: notes,
                  allWorkoutsCompleted: false
                }
              }
            });
          }}
        />
      )}
    </div>
  );
}