import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Calendar, 
  TrendingUp, 
  Target,
  CheckCircle,
  Clock,
  Dumbbell,
  Zap,
  Eye
} from 'lucide-react';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useNavigate } from 'react-router-dom';
import WorkoutPlanSetup from './WorkoutPlanSetup';
import WeeklyWorkoutSchedule from './WeeklyWorkoutSchedule';
import WorkoutCalendar from './WorkoutCalendar';
import GenerateTestWorkout from './GenerateTestWorkout';

const WorkoutPlanDashboard = () => {
  const navigate = useNavigate();
  const { currentPlan, weeklySchedule, preferences, generateNewPlan, loading } = useWorkoutPlan();
  const [activeTab, setActiveTab] = useState('schedule');

  // Calculate weekly progress
  const completedWorkouts = weeklySchedule.filter(w => w.status === 'completed').length;
  const totalWorkouts = weeklySchedule.length;
  const progressPercentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

  const getGoalEmoji = (goal: string) => {
    const goalEmojis: { [key: string]: string } = {
      'build_muscle': '💪',
      'burn_fat': '🔥',
      'tone': '✨',
      'increase_endurance': '🏃',
      'general_fitness': '🌟'
    };
    return goalEmojis[goal] || '🌟';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {completedWorkouts}/{totalWorkouts}
                </p>
                <p className="text-sm text-muted-foreground">Workouts</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={progressPercentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Goal</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  {getGoalEmoji(preferences?.primary_goal || 'general_fitness')}
                  {preferences?.primary_goal?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Set'}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Target</p>
                <p className="text-2xl font-bold">
                  {preferences?.workout_frequency || 3}
                </p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Setup
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">This Week's Schedule</h2>
            <div className="flex gap-2">
              {currentPlan && (
                <Button 
                  onClick={() => navigate('/workout-plans')}
                  variant="default"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View My Workouts
                </Button>
              )}
              {currentPlan && (
                <Button 
                  onClick={generateNewPlan} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Regenerate Plan
                </Button>
              )}
            </div>
          </div>
          <WeeklyWorkoutSchedule />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workout Calendar & Future Workouts</h2>
            {currentPlan && (
              <Button 
                onClick={generateNewPlan} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Regenerate Plan
              </Button>
            )}
          </div>
          <WorkoutCalendar />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">AI Workout Plan Configuration</h2>
          </div>
          
          {/* Test Workout Generator */}
          <GenerateTestWorkout />
          
          {/* Full Setup */}
          <WorkoutPlanSetup />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Workout Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Weekly Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">This Week's Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {completedWorkouts}/{totalWorkouts} workouts
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                {/* Workout Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{completedWorkouts}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">
                      {completedWorkouts * (preferences?.session_duration_preference || 45)}
                    </p>
                    <p className="text-sm text-muted-foreground">Minutes</p>
                  </div>
                </div>

                {/* Current Plan Info */}
                {currentPlan && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Current Plan</h3>
                    <p className="text-sm text-muted-foreground mb-2">{currentPlan.name}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {preferences?.workout_frequency || 3} sessions/week
                      </Badge>
                      <Badge variant="outline">
                        {preferences?.session_duration_preference || 45} min/session
                      </Badge>
                      <Badge variant="outline">
                        {getGoalEmoji(currentPlan.fitness_goal)} {currentPlan.fitness_goal.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutPlanDashboard;