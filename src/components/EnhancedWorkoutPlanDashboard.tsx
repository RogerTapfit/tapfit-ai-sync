import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Zap, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Brain,
  Dumbbell
} from 'lucide-react';

import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useMonthlyWorkoutPlan } from '@/hooks/useMonthlyWorkoutPlan';
import { CalorieWorkoutAdapterService } from '@/services/calorieWorkoutAdapterService';
import { CalibrationDayWorkout, CalibrationResult } from './CalibrationDayWorkout';
import WorkoutPlanSetup from './WorkoutPlanSetup';
import WeeklyWorkoutSchedule from './WeeklyWorkoutSchedule';
import WorkoutCalendar from './WorkoutCalendar';

const EnhancedWorkoutPlanDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCalibration, setShowCalibration] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Original workout plan hook
  const {
    preferences,
    currentPlan,
    weeklySchedule,
    loading,
    savePreferences,
    generateNewPlan
  } = useWorkoutPlan();

  // Enhanced monthly workout plan hook
  const {
    monthlyPlan,
    currentWeek,
    adaptations,
    calibrationResults,
    needsCalibration,
    loading: monthlyLoading,
    generateMonthlyPlan,
    checkForCalorieAdaptations,
    progressToNextWeek,
    getCurrentWeekWorkouts,
    getProgressPercentage
  } = useMonthlyWorkoutPlan();

  // Check for nutrition-based adaptations on component mount
  useEffect(() => {
    const checkAdaptations = async () => {
      if (!needsCalibration && monthlyPlan) {
        await checkForCalorieAdaptations();
      }
    };
    
    // Check for adaptations daily
    const timer = setTimeout(checkAdaptations, 2000);
    return () => clearTimeout(timer);
  }, [monthlyPlan, needsCalibration]);

  const handleCalibrationComplete = async (results: CalibrationResult[]) => {
    setShowCalibration(false);
    toast.success('Calibration completed! Your personalized plan is ready.');
    
    // Generate enhanced monthly plan with calibration data
    if (preferences) {
      await generateMonthlyPlan(preferences);
    }
    setActiveTab('monthly-plan');
  };

  const handleSkipCalibration = () => {
    setShowCalibration(false);
    setActiveTab('setup');
  };

  const handleGenerateEnhancedPlan = async () => {
    if (!preferences) {
      toast.error('Please set your preferences first');
      return;
    }

    if (needsCalibration) {
      setShowCalibration(true);
      return;
    }

    await generateMonthlyPlan(preferences);
    setActiveTab('monthly-plan');
  };

  const checkNutritionAdaptations = async () => {
    setChecking(true);
    try {
      const adaptation = await checkForCalorieAdaptations();
      if (adaptation) {
        toast.success('Workouts adapted based on your nutrition!');
      } else {
        toast.info('No adaptations needed - you\'re doing great!');
      }
    } catch (error) {
      toast.error('Failed to check for adaptations');
    } finally {
      setChecking(false);
    }
  };

  // Show calibration day if needed
  if (showCalibration) {
    return (
      <div className="container mx-auto p-6">
        <CalibrationDayWorkout 
          onComplete={handleCalibrationComplete}
          onSkip={handleSkipCalibration}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TapFit Workout Plans</h1>
          <p className="text-muted-foreground">
            Personalized training with smart adaptations
          </p>
        </div>
        
        {needsCalibration && (
          <Button 
            onClick={() => setShowCalibration(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="mr-2 h-4 w-4" />
            Start Calibration Day
          </Button>
        )}
      </div>

      {/* Calibration Status */}
      {needsCalibration && (
        <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          {/* Dark Tron background with grid pattern */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 50% 50%, hsl(0 70% 15% / 0.8) 0%, hsl(0 0% 3%) 70%),
                linear-gradient(90deg, transparent 48%, hsl(0 100% 50% / 0.1) 49%, hsl(0 100% 50% / 0.1) 51%, transparent 52%),
                linear-gradient(0deg, transparent 48%, hsl(0 100% 50% / 0.1) 49%, hsl(0 100% 50% / 0.1) 51%, transparent 52%)
              `,
              backgroundSize: '100% 100%, 40px 40px, 40px 40px'
            }}
          />
          
          {/* Animated neon red glow layers */}
          <div 
            className="absolute inset-0 opacity-70 animate-pulse"
            style={{
              background: 'var(--gradient-tron-glow)',
              filter: 'blur(20px)'
            }}
          />
          
          {/* Tron-style animated border */}
          <div className="absolute inset-0 rounded-lg">
            {/* Top border */}
            <div 
              className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"
              style={{
                width: '100%',
                boxShadow: 'var(--glow-tron-red)'
              }}
            />
            
            {/* Bottom border */}
            <div 
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"
              style={{
                width: '100%',
                boxShadow: 'var(--glow-tron-red)',
                animationDelay: '1s'
              }}
            />
            
            {/* Left border */}
            <div 
              className="absolute left-0 top-0 w-[2px] bg-gradient-to-b from-transparent via-red-500 to-transparent animate-pulse"
              style={{
                height: '100%',
                boxShadow: 'var(--glow-tron-red)',
                animationDelay: '0.5s'
              }}
            />
            
            {/* Right border */}
            <div 
              className="absolute right-0 top-0 w-[2px] bg-gradient-to-b from-transparent via-red-500 to-transparent animate-pulse"
              style={{
                height: '100%',
                boxShadow: 'var(--glow-tron-red)',
                animationDelay: '1.5s'
              }}
            />
          </div>
          
          {/* Intense hover glow effect */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: 'var(--gradient-tron-glow)',
              boxShadow: 'var(--glow-tron-ultra)',
              filter: 'blur(30px)'
            }}
          />
          
          {/* Content */}
          <CardContent className="relative z-10 p-8 space-y-6">
            {/* Header with icon and intense glow */}
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-full relative"
                style={{
                  background: 'radial-gradient(circle, hsl(0 100% 50% / 0.3), transparent)',
                  boxShadow: 'var(--glow-tron-intense)'
                }}
              >
                {/* Rotating ring around icon */}
                <div 
                  className="absolute inset-0 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: 'hsl(0 100% 50%) transparent hsl(0 100% 50%) transparent',
                    boxShadow: '0 0 20px hsl(0 100% 50% / 0.8)'
                  }}
                />
                
                <AlertCircle 
                  className="w-8 h-8 animate-pulse relative z-10"
                  style={{ 
                    color: 'hsl(0 100% 65%)',
                    filter: 'drop-shadow(0 0 10px hsl(0 100% 50%))'
                  }}
                />
              </div>
              <div>
                <h3 
                  className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent font-mono tracking-wider"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, hsl(0 100% 65%), hsl(15 100% 50%), hsl(0 100% 65%))',
                    textShadow: '0 0 20px hsl(0 100% 50% / 0.8)'
                  }}
                >
                  CALIBRATION
                </h3>
                <h3 
                  className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent font-mono tracking-wider"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, hsl(0 100% 65%), hsl(15 100% 50%), hsl(0 100% 65%))',
                    textShadow: '0 0 20px hsl(0 100% 50% / 0.8)'
                  }}
                >
                  RECOMMENDED
                </h3>
                <p 
                  className="text-sm mt-2 font-mono tracking-wide"
                  style={{ 
                    color: 'hsl(0 100% 80%)',
                    textShadow: '0 0 10px hsl(0 100% 50% / 0.5)'
                  }}
                >
                  &gt; OPTIMIZE_TRAINING_PROTOCOL
                </p>
              </div>
            </div>

            {/* Description with Tron styling */}
            <div className="space-y-2">
              <p 
                className="text-lg leading-relaxed font-mono"
                style={{ 
                  color: 'hsl(0 100% 85%)',
                  textShadow: '0 0 8px hsl(0 100% 50% / 0.3)'
                }}
              >
                &gt; EXECUTE fitness_calibration.exe
              </p>
              <p 
                className="text-base leading-relaxed"
                style={{ color: 'hsl(0 90% 75%)' }}
              >
                Complete a fitness calibration to get precise weight 
                recommendations and personalized training protocols.
              </p>
            </div>

            {/* Tron-style action button */}
            <Button
              onClick={() => setShowCalibration(true)}
              size="lg"
              className="w-full text-xl font-bold font-mono relative overflow-hidden group/btn transition-all duration-300 tracking-wider"
              style={{
                background: 'var(--gradient-tron-red)',
                border: '2px solid hsl(0 100% 50%)',
                boxShadow: 'var(--glow-tron-intense), inset 0 2px 0 hsl(0 100% 65% / 0.3)',
                color: 'white',
                textShadow: '0 0 10px hsl(0 100% 50%)'
              }}
            >
              {/* Animated scanning line */}
              <div 
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(0 100% 80% / 0.8), transparent)',
                  animation: 'scan 2s infinite linear'
                }}
              />
              
              {/* Corner decorations */}
              <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-red-400" />
              <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-red-400" />
              <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-red-400" />
              <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-red-400" />
              
              {/* Icon with enhanced glow */}
              <Target 
                className="w-6 h-6 mr-3 transition-transform duration-300 group-hover/btn:rotate-180 relative z-10"
                style={{ 
                  color: 'hsl(0 100% 80%)',
                  filter: 'drop-shadow(0 0 8px hsl(0 100% 50%))'
                }}
              />
              
              {/* Text content */}
              <span className="relative z-10">BEGIN_CALIBRATION [15_MINS]</span>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly-plan">30-Day Plan</TabsTrigger>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Monthly Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyPlan ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Week {currentWeek} of 4</span>
                      <span>{Math.round(getProgressPercentage())}%</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {monthlyPlan.template_name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      No monthly plan active
                    </p>
                    <Button 
                      onClick={handleGenerateEnhancedPlan}
                      disabled={loading || monthlyLoading}
                      size="sm"
                    >
                      Generate Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Adaptations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Smart Adaptations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Recent Adaptations</span>
                    <Badge variant="outline">{adaptations.length}</Badge>
                  </div>
                  {adaptations.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Latest: {adaptations[0].reasoning}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recent adaptations
                    </p>
                  )}
                  <Button 
                    onClick={checkNutritionAdaptations}
                    disabled={checking || needsCalibration}
                    size="sm"
                    variant="outline"
                  >
                    {checking ? 'Checking...' : 'Check Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calibration Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Fitness Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calibrationResults ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Level: <span className="capitalize">{calibrationResults.fitness_assessment}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assessed on {new Date(calibrationResults.calibration_date).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Not completed</span>
                    </div>
                    <Button 
                      onClick={() => setShowCalibration(true)}
                      size="sm"
                      variant="outline"
                    >
                      Start Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Adaptations List */}
          {adaptations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Workout Adaptations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adaptations.slice(0, 5).map((adaptation, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {new Date(adaptation.date).toLocaleDateString()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {adaptation.trigger_type}
                          </Badge>
                        </div>
                        <p className="text-sm">{adaptation.reasoning}</p>
                        {adaptation.adaptations_applied.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied: {adaptation.adaptations_applied.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleGenerateEnhancedPlan}
                  disabled={loading || monthlyLoading}
                  className="w-full"
                >
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Generate 30-Day Plan
                </Button>
                {currentWeek < 4 && monthlyPlan && (
                  <Button 
                    onClick={progressToNextWeek}
                    variant="outline"
                    className="w-full"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Advance to Week {currentWeek + 1}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nutrition Tracking</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Smart Adaptations</span>
                  <Badge variant={needsCalibration ? "secondary" : "default"}>
                    {needsCalibration ? 'Needs Calibration' : 'Enabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Tracking</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly-plan">
          {monthlyPlan ? (
            <Card>
              <CardHeader>
                <CardTitle>{monthlyPlan.template_name}</CardTitle>
                <p className="text-muted-foreground">
                  Current Week: {currentWeek} of {monthlyPlan.total_weeks}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={getProgressPercentage()} className="h-3" />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">This Week's Focus</h4>
                      <div className="space-y-2">
                        {getCurrentWeekWorkouts().map((workout, index) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize">{workout.day}</span>
                              <Badge variant="outline">{workout.muscle_group}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {workout.time} • {workout.duration} minutes • {workout.exercises.length} exercises
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Plan Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Duration:</span>
                          <span>{monthlyPlan.duration_days} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weeks Completed:</span>
                          <span>{currentWeek - 1} of {monthlyPlan.total_weeks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progress:</span>
                          <span>{Math.round(getProgressPercentage())}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Monthly Plan Active</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a comprehensive 30-day workout plan with smart adaptations
                </p>
                <Button onClick={handleGenerateEnhancedPlan}>
                  Create Monthly Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <WeeklyWorkoutSchedule />
        </TabsContent>

        <TabsContent value="calendar">
          <WorkoutCalendar />
        </TabsContent>

        <TabsContent value="setup">
          <WorkoutPlanSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedWorkoutPlanDashboard;