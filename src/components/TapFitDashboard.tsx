import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Heart, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp,
  Brain,
  Users,
  Trophy,
  Settings,
  Palette,
  Apple,
  RefreshCw,
  User
} from "lucide-react";
import heroImage from "@/assets/tapfit-hero-new.jpg";
const HERO_MASCOT_URL = "/lovable-uploads/e3f47cfe-bdb8-47c1-a1d6-4df0229e046f.png";
import { TapCoinsWidget } from "./TapCoinsWidget";
import { AvatarDisplay } from "./AvatarDisplay";
import { AvatarBuilder } from "./AvatarBuilder";
import { TodaysPerformance } from "./TopPriorityStats";
import { PowerLevelMeter } from "./PowerLevelMeter";
import { useTapCoins } from "@/hooks/useTapCoins";

import { useAvatar } from "@/lib/avatarState";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { useAuth } from "./AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import FitnessChatbot from "./FitnessChatbot";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useRecentWorkouts } from "@/hooks/useRecentWorkouts";
import { Camera, Calendar } from "lucide-react";
import { ComprehensiveCalendar } from "./ComprehensiveCalendar";

interface TapFitDashboardProps {
  onPageChange?: (page: string) => void;
}

const TapFitDashboard = ({ onPageChange }: TapFitDashboardProps) => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name?: string; id?: string } | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Use the new AI insights hook
  const { insights: aiInsights, loading: insightsLoading, lastUpdated, refetch: refetchInsights } = useAIInsights(userProfile?.id);
  
  // Use real workout data
  const { recentWorkouts, loading: workoutsLoading } = useRecentWorkouts(userProfile?.id);
  const [todayStats, setTodayStats] = useState({
    calories: 280,
    duration: 45,
    exercises: 8,
    heartRate: 142
  });
  const { awardCoins } = useTapCoins();
  const { avatar: selectedAvatar } = useAvatar();
  const { todaysProgress } = useWorkoutLogger();
  const { user } = useAuth();

  // Derive a friendly first name for greeting
  const greetingName = (() => {
    const meta: any = user?.user_metadata || {};
    const first = typeof meta.first_name === 'string' ? meta.first_name.trim() : '';
    if (first) return first.split(' ')[0];
    const full = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
    if (full) return full.split(' ')[0];
    const profileName = typeof (userProfile as any)?.full_name === 'string' ? (userProfile as any).full_name : '';
    if (profileName) return profileName.split(' ')[0];
    return '';
  })();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, id')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setUserProfile(data);
        }
      }
    };
    
    fetchUserProfile();
  }, [user?.id]);

  // Update today's stats with real data from workout progress
  useEffect(() => {
    if (todaysProgress.completed_exercises > 0) {
      setTodayStats(prev => ({
        ...prev,
        exercises: todaysProgress.completed_exercises
      }));
    }
  }, [todaysProgress]);

  useEffect(() => {
    // Simulate connection after 2 seconds
    const timer = setTimeout(() => setIsConnected(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartWorkout = async () => {
    // No coins for just starting - coins are earned per rep completed
    
    // Navigate to workout list
    navigate('/workout-list');
  };

  const handleStartRun = () => {
    navigate('/run/setup');
  };

  const handleStartRide = () => {
    navigate('/ride/setup');
  };

  const handleStartSwim = () => {
    navigate('/swim/setup');
  };

  const handleCaloriesConsumedClick = () => {
    try {
      localStorage.setItem('tapfit-open-food-entries', 'true');
    } catch {}
    onPageChange?.('nutrition');
  };

  const handleCaloriesBurnedClick = () => {
    navigate('/workout-history');
  };

  if (showAvatarBuilder) {
    return <AvatarBuilder onClose={() => setShowAvatarBuilder(false)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl h-[250px] sm:h-[270px] md:h-[280px] lg:h-[320px]">
        <img 
          src={heroImage} 
          alt="TapFit Futuristic Gym" 
          className="w-full h-full object-cover object-center"
        />
        {/* Stronger left-to-right overlay for contrast on small screens; lighter on md+ */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent md:from-background/75 md:via-background/55 md:to-background/20" />
        {/* Subtle top fade on md+ only to avoid over-darkening on phones */}
        <div className="absolute inset-0 md:bg-gradient-to-t md:from-background/50 md:to-transparent" />

        {/* Content grid: single column on mobile, text | mascot on md+ */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4 p-4 sm:p-6 lg:p-8 z-10">
          <div className="relative max-w-[min(90%,680px)] pr-24 sm:pr-28 md:pr-0">
            <div className="absolute -inset-2 rounded-lg bg-background/35 blur-sm" />
            <div className="relative">
              <h1 className="text-[clamp(1.25rem,3.5vw,2.5rem)] md:text-4xl font-bold text-foreground drop-shadow-lg">
                Welcome Back{greetingName ? `, ${greetingName}` : ''}
              </h1>
              <p className="text-foreground/90 text-[clamp(0.9rem,2.4vw,1rem)] drop-shadow-sm">
                Ready to crush today&apos;s workout?
              </p>
            </div>
          </div>

          <img
            src={selectedAvatar?.image_url || HERO_MASCOT_URL}
            alt={selectedAvatar?.name || "TapFit mascot red robot"}
            className="hidden md:block max-h-80 max-w-80 w-auto object-contain drop-shadow-xl pointer-events-none select-none"
            loading="eager"
          />
        </div>

        {/* Mobile mascot (visible on phones), absolute bottom-right */}
        <img
          src={selectedAvatar?.image_url || HERO_MASCOT_URL}
          alt={selectedAvatar?.name || "TapFit mascot red robot"}
          className="md:hidden absolute bottom-4 right-2 max-h-52 max-w-40 w-auto object-contain drop-shadow-xl pointer-events-none select-none z-10"
          loading="eager"
        />

        {/* TapFit wordmark logo top-left */}
        <div className="absolute left-3 top-3 sm:left-4 z-20">
          <span className="px-2 py-1 rounded-md bg-background/50 backdrop-blur-sm text-foreground font-extrabold tracking-tight text-sm">TapFit</span>
        </div>

        {/* Status indicators */}
        <div className="absolute right-3 top-3 md:hidden">
          <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <div className="hidden md:flex absolute right-6 top-6 items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-foreground/80">{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* AI Workout Plan Button */}
      <Card className="glow-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        <div className="relative p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 shadow-glow">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">AI Workout Plan</h3>
              </div>
            </div>
            <Button 
              variant="glow" 
              size="lg"
              onClick={() => navigate('/workout-plan')}
              className="shadow-glow w-full"
            >
              Get Started
            </Button>
          </div>
        </div>
      </Card>

      {/* 1. Today's Performance - Right after hero image */}
        <TodaysPerformance 
          onStartWorkout={handleStartWorkout}
          onStartRun={handleStartRun}
          onStartRide={handleStartRide}
          onStartSwim={handleStartSwim}
          onCaloriesConsumedClick={handleCaloriesConsumedClick}
          onCaloriesBurnedClick={handleCaloriesBurnedClick}
        />

      {/* 2. Tap Coins Widget */}
      <TapCoinsWidget />

      {/* Calendar Feature */}
      <Card className="glow-card animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Your Fitness Calendar
            </h3>
            <ComprehensiveCalendar 
              trigger={
                <Button variant="glow" size="sm" className="shadow-glow">
                  View Full Calendar
                </Button>
              }
            />
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Track your workouts, food entries, and daily activities all in one place
          </p>
          
          {/* Mini calendar preview */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="p-1 font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
            {/* Sample week preview */}
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={i} 
                  className={`p-1 rounded text-xs ${
                    isToday 
                      ? 'bg-primary text-primary-foreground font-bold' 
                      : 'hover:bg-accent'
                  }`}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* SEE FOOD and BODY SCAN - side by side on wide, stacked on small */}
      <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* SEE FOOD */}
        <Button
          size="lg"
          onClick={() => navigate('/food-scanner')}
          className="relative group h-20 px-12 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 hover:transition-transform hover:duration-200 animate-food-glow border-0 rounded-2xl w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl blur opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-4 justify-center">
            <Camera className="h-8 w-8" />
            <div className="flex flex-col items-start">
              <span className="text-2xl font-black">SEE FOOD</span>
              <span className="text-sm font-normal opacity-90">AI Food Scanner</span>
            </div>
          </div>
        </Button>

        {/* BODY SCAN */}
        <Button
          size="lg"
          onClick={() => navigate('/body-scan')}
          className="relative group h-20 px-12 text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-blue-500/40 transform hover:scale-105 hover:transition-transform hover:duration-200 border-0 rounded-2xl w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-4 justify-center">
            <Camera className="h-8 w-8" />
            <div className="flex flex-col items-start">
              <span className="text-2xl font-black">BODY SCAN</span>
              <span className="text-sm font-normal opacity-90">AI Body Analyzer</span>
            </div>
          </div>
        </Button>
      </div>

      {/* Choose Avatar */}
      <Button
        size="lg"
        onClick={() => navigate('/avatars')}
        className="relative group h-20 px-12 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-2xl hover:shadow-purple-500/40 transform hover:scale-105 hover:transition-transform hover:duration-200 border-0 rounded-2xl w-full my-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center gap-4 justify-center">
          <User className="h-8 w-8" />
          <div className="flex flex-col items-start">
            <span className="text-2xl font-black">CHOOSE COACH</span>
            <span className="text-sm font-normal opacity-90">Customize Your Coach</span>
          </div>
        </div>
      </Button>

      {/* 3. Weekly Progress */}
      <Card className="glow-card animate-slide-up">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Today's Exercises</span>
                <span>{todaysProgress.completed_exercises}/{todaysProgress.total_exercises || 8} completed</span>
              </div>
              <Progress value={todaysProgress.completion_percentage || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Calorie Goal</span>
                <span>1,850/2,000</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Power Level */}
      <PowerLevelMeter />


      {/* AI Insights */}
      <Card className="ai-feedback animate-slide-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <Badge variant="secondary" className="ml-auto">
              {insightsLoading ? 'Updating...' : 'Live'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetchInsights}
              disabled={insightsLoading}
              className="h-8 w-8 p-0 ml-2"
            >
              <RefreshCw className={`h-3 w-3 ${insightsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="space-y-3">
            {insightsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 animate-pulse">
                    <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded mt-0.5 flex-shrink-0"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              aiInsights.map((insight, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === 'positive' 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : insight.type === 'warning'
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'bg-background/50'
                }`}>
                  <Zap className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    insight.type === 'positive' 
                      ? 'text-green-500' 
                      : insight.type === 'warning'
                      ? 'text-amber-500'
                      : 'text-primary'
                  }`} />
                  <p className="text-sm">{insight.text}</p>
                </div>
              ))
            )}
            {lastUpdated && !insightsLoading && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Workouts */}
      <Card className="glow-card animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Workouts</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {workoutsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                  <div>
                    <p className="font-semibold">{workout.type}</p>
                    <p className="text-sm text-muted-foreground">{workout.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{workout.duration}m • {workout.calories} cal</p>
                    {workout.change && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">{workout.change}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent workouts found</p>
                <p className="text-sm">Start your first workout to see your progress here!</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="glow-card h-16 text-lg">
          <Users className="h-5 w-5 mr-2" />
          Social
        </Button>
        
        <Button variant="outline" className="glow-card h-16 text-lg">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          View Challenges
        </Button>
      </div>


      {/* AI Fitness Chatbot */}
      <FitnessChatbot 
        isOpen={showChatbot}
        onToggle={() => setShowChatbot(!showChatbot)}
        userId={userProfile?.id}
      />
    </div>
  );
};

export default TapFitDashboard;