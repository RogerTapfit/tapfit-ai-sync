
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Dumbbell, Target, CheckCircle2, SkipForward } from 'lucide-react';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { format, addDays, startOfWeek, isToday, isFuture, parseISO } from 'date-fns';

const WorkoutCalendar = () => {
  const { weeklySchedule, markWorkoutComplete, rescheduleWorkout, loading } = useWorkoutPlan();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Format time to AM/PM format (e.g., "6:00 PM")
  const formatTimeAMPM = (timeString: string) => {
    // Handle various time formats and convert to AM/PM
    try {
      // If it's already in HH:mm format, parse it
      if (timeString.includes(':') && timeString.length === 5) {
        const date = new Date(`2000-01-01T${timeString}`);
        return format(date, 'h:mm a');
      }
      
      // Handle other time formats
      const date = new Date(`2000-01-01T${timeString}`);
      return format(date, 'h:mm a');
    } catch {
      return timeString; // Return original if parsing fails
    }
  };

  // Get workouts for the next 4 weeks
  const futureWorkouts = useMemo(() => {
    const today = new Date();
    const futureWorkoutsList = [];
    
    // Generate workouts for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      const weekStart = addDays(startOfWeek(today), week * 7);
      
      weeklySchedule.forEach(workout => {
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(workout.day);
        const workoutDate = addDays(weekStart, dayIndex);
        
        futureWorkoutsList.push({
          ...workout,
          fullDate: workoutDate,
          dateString: format(workoutDate, 'yyyy-MM-dd'),
          isToday: isToday(workoutDate),
          isFuture: isFuture(workoutDate) || isToday(workoutDate)
        });
      });
    }
    
    return futureWorkoutsList.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [weeklySchedule]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'missed': return 'bg-red-500';
      case 'rescheduled': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'missed': return <SkipForward className="h-4 w-4" />;
      default: return <Dumbbell className="h-4 w-4" />;
    }
  };

  const getMuscleGroupEmoji = (muscleGroup: string) => {
    const emojis: { [key: string]: string } = {
      'chest': '💪',
      'back': '🏋️',
      'legs': '🦵',
      'shoulders': '💪',
      'arms': '💪',
      'core': '🔥',
      'cardio': '🏃',
      'chest_triceps': '💪',
      'back_biceps': '🏋️',
      'legs_glutes': '🦵',
      'shoulders_core': '💪'
    };
    return emojis[muscleGroup] || '💪';
  };

  // Group workouts by date
  const workoutsByDate = useMemo(() => {
    return futureWorkouts.reduce((acc, workout) => {
      const date = workout.dateString;
      if (!acc[date]) acc[date] = [];
      acc[date].push(workout);
      return acc;
    }, {} as Record<string, typeof futureWorkouts>);
  }, [futureWorkouts]);

  return (
    <div className="space-y-6">
      {/* Calendar Grid View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Workout Calendar - Next 4 Weeks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(workoutsByDate).map(([date, workouts]) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${workouts[0]?.isToday ? 'text-primary' : ''}`}>
                    {format(parseISO(date), 'EEE, MMM d')}
                    {workouts[0]?.isToday && (
                      <Badge variant="default" className="ml-2">Today</Badge>
                    )}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {(workouts as any[]).map((workout, index) => (
                    <Card key={`${workout.id}-${index}`} className="p-3 border-l-4 border-l-primary">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMuscleGroupEmoji(workout.muscle_group)}</span>
                            <span className="font-medium text-sm">
                              {workout.muscle_group.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(workout.status || 'scheduled')} text-white border-0`}
                          >
                            {getStatusIcon(workout.status || 'scheduled')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAMPM(workout.time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {workout.duration}min
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {workout.exercises.length} exercises planned
                        </div>
                        
                        {workout.isFuture && workout.status === 'scheduled' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => workout.id && markWorkoutComplete(workout.id)}
                              disabled={loading}
                              className="text-xs"
                            >
                              Mark Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming Workouts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Upcoming Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {futureWorkouts.filter(w => w.isFuture && w.status === 'scheduled').slice(0, 6).map((workout, index) => (
              <div key={`${workout.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getMuscleGroupEmoji(workout.muscle_group)}</div>
                  <div>
                    <h4 className="font-medium">
                      {workout.muscle_group.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {format(workout.fullDate, 'EEEE, MMMM d')} at {formatTimeAMPM(workout.time)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workout.exercises.length} exercises • {workout.duration} minutes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {workout.isToday && (
                    <Badge variant="default">Today</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => workout.id && markWorkoutComplete(workout.id)}
                    disabled={loading}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            ))}
            
            {futureWorkouts.filter(w => w.isFuture && w.status === 'scheduled').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming workouts scheduled.</p>
                <p className="text-sm">Generate a new workout plan to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutCalendar;
