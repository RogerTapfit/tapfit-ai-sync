import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Weight, Target, Clock, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutActivity } from '@/hooks/useCalendarData';
import { MachineRegistryService } from '@/services/machineRegistryService';

interface CompletedWorkoutDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutActivity | null;
}

interface ExerciseLog {
  id: string;
  exercise_name: string;
  machine_name?: string;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number;
  completed_at: string;
}

export const CompletedWorkoutDetail: React.FC<CompletedWorkoutDetailProps> = ({
  open,
  onOpenChange,
  workout,
}) => {
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && workout) {
      fetchExerciseDetails();
    }
  }, [open, workout]);

  const fetchExerciseDetails = async () => {
    if (!workout) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('workout_log_id', workout.id)
        .order('completed_at', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercise details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMachineImage = (machineName: string) => {
    const machine = MachineRegistryService.getAllMachines().find(
      m => m.name.toLowerCase() === machineName?.toLowerCase() ||
           m.name.toLowerCase().includes(machineName?.toLowerCase() || '')
    );
    return machine?.imageUrl;
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets_completed, 0);
  const totalReps = exercises.reduce((sum, ex) => sum + ex.reps_completed, 0);
  const totalVolume = exercises.reduce((sum, ex) => sum + (ex.weight_used || 0) * ex.reps_completed, 0);
  const avgWeight = exercises.filter(ex => ex.weight_used).length > 0
    ? Math.round(exercises.reduce((sum, ex) => sum + (ex.weight_used || 0), 0) / exercises.filter(ex => ex.weight_used).length)
    : 0;

  if (!workout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {workout.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workout Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-center">
                <Dumbbell className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold">{exercises.length}</div>
                <div className="text-xs text-muted-foreground">Exercises</div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
              <div className="text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-2xl font-bold">{totalReps}</div>
                <div className="text-xs text-muted-foreground">Total Reps</div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-amber-500/5 to-amber-600/10 border-amber-500/20">
              <div className="text-center">
                <Weight className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <div className="text-2xl font-bold">{avgWeight}</div>
                <div className="text-xs text-muted-foreground">Avg Weight</div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
              <div className="text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </div>
            </Card>
          </div>

          {/* Workout Meta */}
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {workout.muscleGroup}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {workout.duration} min
                </div>
                {workout.calories && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {workout.calories} cal
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Exercise Details List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : exercises.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Exercise Details ({exercises.length})
              </h3>
              
              <div className="space-y-3">
                {exercises.map((exercise, index) => {
                  const machineImage = getMachineImage(exercise.machine_name || exercise.exercise_name);
                  
                  return (
                    <Card key={exercise.id} className="p-4 hover:bg-accent/30 transition-colors">
                      <div className="flex gap-4">
                        {/* Machine Image */}
                        {machineImage && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={machineImage} 
                              alt={exercise.exercise_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Exercise Info */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
                              <h4 className="font-semibold text-lg">{exercise.exercise_name}</h4>
                            </div>
                            {exercise.machine_name && exercise.machine_name !== exercise.exercise_name && (
                              <p className="text-sm text-muted-foreground">{exercise.machine_name}</p>
                            )}
                          </div>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                              <Dumbbell className="h-4 w-4 text-primary" />
                              <div>
                                <div className="text-sm font-bold">{exercise.sets_completed}</div>
                                <div className="text-xs text-muted-foreground">Sets</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-green-500/5 rounded-lg">
                              <Target className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="text-sm font-bold">{exercise.reps_completed}</div>
                                <div className="text-xs text-muted-foreground">Reps</div>
                              </div>
                            </div>
                            {exercise.weight_used && (
                              <div className="flex items-center gap-2 p-2 bg-amber-500/5 rounded-lg">
                                <Weight className="h-4 w-4 text-amber-500" />
                                <div>
                                  <div className="text-sm font-bold">{exercise.weight_used}</div>
                                  <div className="text-xs text-muted-foreground">lbs</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Volume Calculation */}
                          {exercise.weight_used && (
                            <div className="text-xs text-muted-foreground">
                              Total volume: {(exercise.weight_used * exercise.reps_completed).toLocaleString()} lbs
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Overall Summary */}
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Workout Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-bold text-lg text-primary">{totalSets}</div>
                    <div className="text-muted-foreground">Total Sets</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-primary">{totalReps}</div>
                    <div className="text-muted-foreground">Total Reps</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-primary">{avgWeight}</div>
                    <div className="text-muted-foreground">Avg Weight (lbs)</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-primary">{totalVolume.toLocaleString()}</div>
                    <div className="text-muted-foreground">Total Volume (lbs)</div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Exercise Data</h3>
              <p className="text-sm text-muted-foreground">
                No exercise logs found for this workout
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
