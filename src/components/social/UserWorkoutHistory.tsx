import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserWorkoutHistory } from '@/hooks/useUserWorkoutHistory';
import { useMemo, useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar as CalendarIcon, 
  Dumbbell, 
  Flame, 
  Clock,
  X,
  Filter,
  TrendingUp,
  Zap,
  Trophy,
  Timer,
  Activity
} from 'lucide-react';
import { SetDetailTable } from './SetDetailTable';
import { RPEMeter } from './RPEMeter';
import { PRBadge } from './PRBadge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface UserWorkoutHistoryProps {
  userId: string;
}

export default function UserWorkoutHistory({ userId }: UserWorkoutHistoryProps) {
  const { workouts, loading } = useUserWorkoutHistory(userId);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  // Extract unique muscle groups and machines from workouts
  const { muscleGroups, machines } = useMemo(() => {
    const muscleGroupSet = new Set<string>();
    const machineSet = new Set<string>();
    
    workouts.forEach(workout => {
      muscleGroupSet.add(workout.muscleGroup);
      workout.exercises.forEach(exercise => {
        if (exercise.machine_name) {
          machineSet.add(exercise.machine_name);
        }
      });
    });

    return {
      muscleGroups: Array.from(muscleGroupSet).sort(),
      machines: Array.from(machineSet).sort()
    };
  }, [workouts]);

  // Filter workouts based on selected criteria
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(workout => {
      // Date range filter
      if (dateFrom && workout.date < dateFrom) return false;
      if (dateTo && workout.date > dateTo) return false;

      // Muscle group filter
      if (selectedMuscleGroup !== 'all' && workout.muscleGroup !== selectedMuscleGroup) {
        return false;
      }

      // Machine filter
      if (selectedMachine !== 'all') {
        const hasMachine = workout.exercises.some(
          exercise => exercise.machine_name === selectedMachine
        );
        if (!hasMachine) return false;
      }

      return true;
    });
  }, [workouts, dateFrom, dateTo, selectedMuscleGroup, selectedMachine]);

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedMuscleGroup('all');
    setSelectedMachine('all');
  };

  const hasActiveFilters = dateFrom || dateTo || selectedMuscleGroup !== 'all' || selectedMachine !== 'all';

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No workouts logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Date From */}
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    {dateTo ? format(dateTo, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Muscle Group Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Muscle Group</label>
              <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="All muscle groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Muscle Groups</SelectItem>
                  {muscleGroups.map(group => (
                    <SelectItem key={group} value={group} className="capitalize">
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Machine Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Machine</label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger>
                  <SelectValue placeholder="All machines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {machines.map(machine => (
                    <SelectItem key={machine} value={machine}>
                      {machine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>
          Showing {filteredWorkouts.length} of {workouts.length} workouts
        </span>
      </div>

      {/* Workout List */}
      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No workouts match your filters</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mt-2"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkouts.map((workout) => {
        const isExpanded = expandedWorkouts.has(workout.id);
        return (
          <Collapsible
            key={workout.id}
            open={isExpanded}
            onOpenChange={() => toggleWorkout(workout.id)}
          >
            <Card className="hover:shadow-lg transition-all">
              <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Dumbbell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold capitalize">{workout.muscleGroup}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(workout.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!workout.isCompleted && (
                        <Badge variant="destructive" className="text-xs">
                          Abandoned
                        </Badge>
                      )}
                      {workout.totalSets === 0 && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20">
                          Incomplete Data
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {workout.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Workout Statistics Summary */}
                  <div className="p-4 mb-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Workout Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total Volume</p>
                          <p className="text-base font-bold">{workout.totalVolume.toLocaleString()} lbs</p>
                        </div>
                      </div>
                      {workout.avgPowerLevel && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Power</p>
                            <p className="text-base font-bold">{workout.avgPowerLevel.toFixed(1)}/10</p>
                          </div>
                        </div>
                      )}
                      {workout.prCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" fill="currentColor" />
                          <div>
                            <p className="text-xs text-muted-foreground">PRs</p>
                            <p className="text-base font-bold text-yellow-500">{workout.prCount}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total Rest</p>
                          <p className="text-base font-bold">{Math.round(workout.totalRestTime / 60)} min</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-lg font-semibold">{workout.duration} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Calories</p>
                        <p className="text-lg font-semibold">{workout.caloriesBurned}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sets × Reps</p>
                        <p className="text-lg font-semibold">{workout.totalSets} × {workout.totalReps}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant="outline">{workout.muscleGroup}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Indicator */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm font-medium text-muted-foreground">
                      {isExpanded ? 'Hide' : 'View'} {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} breakdown
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Exercise Details */}
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Exercises Performed
                </h4>
                {workout.exercises.map((exercise, idx) => {
                  const hasSetData = exercise.sets && exercise.sets.length > 0;
                  
                  return (
                    <div key={idx} className="rounded-lg border border-border overflow-hidden">
                      {/* Exercise Header */}
                      <div className="p-4 bg-muted/30 border-b border-border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-base">{exercise.exercise_name}</h5>
                              {exercise.is_pr && <PRBadge variant="full" />}
                              {!hasSetData && (
                                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20">
                                  Incomplete
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {exercise.machine_name}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
                            <p className="text-lg font-bold text-primary">
                              {hasSetData ? `${exercise.total_volume.toLocaleString()} lbs` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      
                        {/* Exercise Stats */}
                        {hasSetData ? (
                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Sets:</span>
                              <span className="font-semibold">{exercise.sets_completed}</span>
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Total Reps:</span>
                              <span className="font-semibold">{exercise.reps_completed}</span>
                            </div>
                            {exercise.avg_rpe && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground">Avg RPE:</span>
                                  <span className="font-semibold">{exercise.avg_rpe.toFixed(1)}/10</span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                            <p className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              No set data recorded for this exercise
                            </p>
                          </div>
                        )}

                        {/* RPE Meter */}
                        {hasSetData && exercise.avg_rpe && (
                          <div className="mt-3">
                            <RPEMeter rpe={exercise.avg_rpe} showLabel={true} />
                          </div>
                        )}
                      </div>

                      {/* Set-by-Set Breakdown */}
                      {hasSetData ? (
                        <SetDetailTable sets={exercise.sets} totalVolume={exercise.total_volume} />
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20">
                          <p>Set-by-set details are not available.</p>
                          <p className="text-xs mt-1">Complete your workout with set details to see full breakdowns.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
        </div>
      )}
    </div>
  );
}
