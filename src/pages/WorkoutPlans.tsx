import React, { useState } from 'react';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Target, Dumbbell, ChevronLeft, ChevronRight, ArrowLeft, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkoutBreakdown from '@/components/WorkoutBreakdown';

const WorkoutPlans = () => {
  const navigate = useNavigate();
  const { currentPlan, weeklySchedule, loading, markWorkoutComplete } = useWorkoutPlan();
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedWeeklyWorkout, setSelectedWeeklyWorkout] = useState<any>(null);

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const navigateWorkout = (direction: 'prev' | 'next') => {
    if (!currentPlan?.workouts?.length) return;
    
    if (direction === 'prev') {
      setSelectedWorkoutIndex(prev => 
        prev === 0 ? currentPlan.workouts.length - 1 : prev - 1
      );
    } else {
      setSelectedWorkoutIndex(prev => 
        prev === currentPlan.workouts.length - 1 ? 0 : prev + 1
      );
    }
  };

  const selectedWorkout = currentPlan?.workouts?.[selectedWorkoutIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading your workout plans...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>No Workout Plan Found</CardTitle>
              <CardDescription>
                You don't have an active workout plan yet. Go to the workout dashboard to generate one.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <div className="container mx-auto p-6 space-y-6">
        {showBreakdown ? (
          <WorkoutBreakdown 
            workout={selectedWeeklyWorkout || selectedWorkout} 
            onBack={() => {
              setShowBreakdown(false);
              setSelectedWeeklyWorkout(null);
            }} 
          />
        ) : (
          <>
            {/* Plan Overview */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">{currentPlan.name}</h1>
              <p className="text-muted-foreground">
                Goal: {currentPlan.fitness_goal.replace('_', ' ')}
              </p>
              {currentPlan.notes && (
                <p className="text-sm text-muted-foreground">{currentPlan.notes}</p>
              )}
            </div>

            <Tabs defaultValue="workout-cycle" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workout-cycle">Workout Cycle</TabsTrigger>
            <TabsTrigger value="weekly-schedule">This Week's Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="workout-cycle" className="space-y-4">
            {/* Workout Navigation */}
            {selectedWorkout && (
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigateWorkout('prev')}
                  disabled={!currentPlan.workouts?.length}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Day {selectedWorkoutIndex + 1} of {currentPlan.workouts?.length || 0}
                  </Badge>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => navigateWorkout('next')}
                  disabled={!currentPlan.workouts?.length}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Selected Workout Details */}
            {selectedWorkout && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">
                        {selectedWorkout.day} - {selectedWorkout.muscle_group.replace('_', ' ')}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {selectedWorkout.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {selectedWorkout.muscle_group.replace('_', ' ')}
                        </span>
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowBreakdown(true)}
                      className="ml-auto"
                    >
                      <List className="h-4 w-4 mr-2" />
                      View Full Breakdown
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Exercises</h3>
                    <div className="grid gap-3">
                      {selectedWorkout.exercises?.map((exercise, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                              {exercise.order}
                            </div>
                            <div>
                              <p className="font-medium">{exercise.machine}</p>
                              {exercise.weight_guidance && (
                                <p className="text-sm text-muted-foreground">
                                  {exercise.weight_guidance}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {exercise.duration_minutes ? (
                              <>
                                <p className="font-medium">
                                  {exercise.duration_minutes} minutes
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.intensity}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">
                                  {exercise.sets} sets × {exercise.reps} reps
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.rest_seconds}s rest
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weekly-schedule" className="space-y-4">
            <div className="grid gap-4">
              {weeklySchedule.map((workout) => (
                <Card key={workout.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="capitalize">
                          {workout.day} - {workout.muscle_group.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {workout.scheduled_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(workout.time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-4 w-4" />
                            {workout.duration} min
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            workout.status === 'completed' ? 'default' :
                            workout.status === 'missed' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {workout.status}
                        </Badge>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedWeeklyWorkout(workout);
                            setShowBreakdown(true);
                          }}
                        >
                          <List className="h-4 w-4 mr-2" />
                          Preview Workout
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {workout.exercises?.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{exercise.machine}</span>
                          <span className="text-muted-foreground">
                            {exercise.duration_minutes 
                              ? `${exercise.duration_minutes} min` 
                              : `${exercise.sets}×${exercise.reps}`
                            }
                          </span>
                        </div>
                      ))}
                      {workout.exercises && workout.exercises.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{workout.exercises.length - 3} more exercises
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkoutPlans;