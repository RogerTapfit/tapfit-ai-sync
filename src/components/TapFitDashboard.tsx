import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Heart, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp,
  Bluetooth,
  Watch,
  Brain,
  Users,
  Trophy,
  Settings
} from "lucide-react";
import heroImage from "@/assets/tapfit-hero.jpg";
import { TapCoinsWidget } from "./TapCoinsWidget";
import { AvatarDisplay } from "./AvatarDisplay";
import { useTapCoins } from "@/hooks/useTapCoins";
import { useAvatar } from "@/hooks/useAvatar";

const TapFitDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [todayStats, setTodayStats] = useState({
    calories: 280,
    duration: 45,
    exercises: 8,
    heartRate: 142
  });
  const { awardCoins } = useTapCoins();
  const { avatarData } = useAvatar();

  useEffect(() => {
    // Simulate connection after 2 seconds
    const timer = setTimeout(() => setIsConnected(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartWorkout = async () => {
    // Award coins for starting a workout
    await awardCoins(10, 'earn_workout', 'Started a new workout session');
  };

  const aiInsights = [
    "Your strength is improving 15% faster than average",
    "Consider 2-3 rest days this week for optimal recovery",
    "Your cardio endurance has increased 8% this month"
  ];

  const recentWorkouts = [
    { date: "Today", type: "Upper Body", duration: 45, calories: 280 },
    { date: "Yesterday", type: "Cardio", duration: 30, calories: 220 },
    { date: "2 days ago", type: "Legs", duration: 50, calories: 310 }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl h-48 md:h-64">
        <img 
          src={heroImage} 
          alt="TapFit Futuristic Gym" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-between p-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-foreground/80 text-sm md:text-base">Ready to crush today's workout?</p>
            </div>
            {avatarData && (
              <div className="hidden md:block">
                <AvatarDisplay avatarData={avatarData} size="small" />
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

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bluetooth className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Smart Machines</p>
              <p className="text-sm text-muted-foreground">
                {isConnected ? '3 devices connected' : 'Scanning...'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Watch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Apple Watch</p>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Synced' : 'Connecting...'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">AI Coach</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tap Coins Widget */}
      <div className="mb-6">
        <TapCoinsWidget />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card animate-fade-in">
          <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{todayStats.calories}</p>
          <p className="text-sm text-muted-foreground">Calories</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{todayStats.duration}m</p>
          <p className="text-sm text-muted-foreground">Duration</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Target className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{todayStats.exercises}</p>
          <p className="text-sm text-muted-foreground">Exercises</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{todayStats.heartRate}</p>
          <p className="text-sm text-muted-foreground">Avg BPM</p>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="ai-feedback animate-slide-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <Badge variant="secondary" className="ml-auto">Live</Badge>
          </div>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
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
            {recentWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                <div>
                  <p className="font-semibold">{workout.type}</p>
                  <p className="text-sm text-muted-foreground">{workout.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{workout.duration}m • {workout.calories} cal</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+12% vs avg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="glow-button h-16 text-lg" onClick={handleStartWorkout}>
          <Activity className="h-5 w-5 mr-2" />
          Start Workout
        </Button>
        
        <Button variant="outline" className="glow-card h-16 text-lg">
          <Users className="h-5 w-5 mr-2" />
          Social
        </Button>
        
        <Button variant="outline" className="glow-card h-16 text-lg">
          <Trophy className="h-5 w-5 mr-2" />
          View Challenges
        </Button>
      </div>

      {/* Weekly Progress */}
      <Card className="glow-card animate-slide-up">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Workout Goal</span>
                <span>4/5 sessions</span>
              </div>
              <Progress value={80} className="h-2" />
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
    </div>
  );
};

export default TapFitDashboard;