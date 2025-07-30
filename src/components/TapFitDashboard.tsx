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
  RefreshCw
} from "lucide-react";
import heroImage from "@/assets/tapfit-hero-new.jpg";
import { TapCoinsWidget } from "./TapCoinsWidget";
import { AvatarDisplay } from "./AvatarDisplay";
import { AvatarBuilder } from "./AvatarBuilder";
import { TodaysPerformance } from "./TopPriorityStats";
import { PowerLevelMeter } from "./PowerLevelMeter";
import { useTapCoins } from "@/hooks/useTapCoins";
import { useAvatar } from "@/hooks/useAvatar";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { useAuth } from "./AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import FitnessChatbot from "./FitnessChatbot";
import { NFCTestPanel } from "./NFCTestPanel";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useRecentWorkouts } from "@/hooks/useRecentWorkouts";

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
  const { avatarData } = useAvatar();
  const { todaysProgress } = useWorkoutLogger();
  const { user } = useAuth();

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
    window.location.href = '/workout-list';
  };


  if (showAvatarBuilder) {
    return <AvatarBuilder onClose={() => setShowAvatarBuilder(false)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl h-48 md:h-64">
        <img 
          src={heroImage} 
          alt="TapFit Futuristic Gym" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-between p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-background/40 blur-sm rounded-lg -m-2" />
              <div className="relative">
                <h1 className="text-2xl md:text-4xl font-bold text-foreground drop-shadow-lg">
                  Welcome Back{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}
                </h1>
                <p className="text-foreground/90 text-sm md:text-base drop-shadow-sm">Ready to crush today's workout?</p>
              </div>
            </div>
            {avatarData && (
              <div className="hidden md:block relative">
                <AvatarDisplay avatarData={avatarData} size="small" />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0"
                  onClick={() => setShowAvatarBuilder(true)}
                >
                  <Palette className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground/80">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
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
        todayStats={todayStats} 
        onStartWorkout={handleStartWorkout} 
      />

      {/* 2. Tap Coins Widget */}
      <TapCoinsWidget />

      {/* Nutrition Quick Access */}
      <Card className="glow-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20 shadow-glow">
                <Apple className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <Button 
              variant="glow" 
              size="lg"
              onClick={() => onPageChange?.('nutrition')}
              className="shadow-glow bg-red-500 hover:bg-red-600 text-white"
            >
              Track Nutrition
            </Button>
          </div>
        </div>
      </Card>

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

      {/* NFC Test Panel */}
      <NFCTestPanel />

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