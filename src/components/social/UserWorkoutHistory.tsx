import { useState, useMemo } from 'react';
import { useUserWorkoutHistory } from '@/hooks/useUserWorkoutHistory';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, Clock, Flame, Activity, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
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
            <Card className="p-4 hover:bg-accent/50 transition-colors">
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
                <Badge variant="outline" className="capitalize">
                  {workout.type}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{workout.duration} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="font-semibold">{workout.caloriesBurned}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Exercises</p>
                    <p className="font-semibold">{workout.exercisesCompleted}</p>
                  </div>
                </div>
              </div>

              {workout.exercises.length > 0 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Exercises
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View Exercises ({workout.exercises.length})
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}

              <CollapsibleContent className="mt-3 space-y-2">
                {workout.exercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-sm">{exercise.exercise_name}</h5>
                        <p className="text-xs text-muted-foreground">{exercise.machine_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Sets: </span>
                        <span className="font-semibold">{exercise.sets_completed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reps: </span>
                        <span className="font-semibold">{exercise.reps_completed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Weight: </span>
                        <span className="font-semibold">{exercise.weight_used} lbs</span>
                      </div>
                    </div>
                  </div>
                ))}
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
