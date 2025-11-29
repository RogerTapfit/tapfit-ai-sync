import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBiometricMood } from '@/hooks/useBiometricMood';
import { MoodCheckinModal } from './MoodCheckinModal';
import { 
  ArrowLeft, 
  Brain, 
  Heart, 
  Moon, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface BiometricMoodDashboardProps {
  onBack?: () => void;
}

export default function BiometricMoodDashboard({ onBack }: BiometricMoodDashboardProps) {
  const { 
    todaysMood, 
    weeklyMoods, 
    readinessScore, 
    correlations, 
    insights,
    isLoading,
    getPerformancePrediction,
    markInsightRead,
    refetch
  } = useBiometricMood();

  const prediction = getPerformancePrediction();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-500/20';
      case 'moderate': return 'bg-yellow-500/20';
      case 'low': return 'bg-red-500/20';
      default: return 'bg-muted';
    }
  };

  const chartConfig = {
    mood: { label: 'Mood', color: 'hsl(var(--primary))' },
    energy: { label: 'Energy', color: 'hsl(142 71% 45%)' },
    stress: { label: 'Stress', color: 'hsl(0 72% 51%)' }
  };

  const chartData = weeklyMoods.map(m => ({
    date: new Date(m.entryDate || '').toLocaleDateString('en-US', { weekday: 'short' }),
    mood: m.moodScore,
    energy: m.energyLevel,
    stress: m.stressLevel
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Biometric Mood Tracker
            </h1>
            <p className="text-muted-foreground text-sm">
              Track mood, discover patterns, optimize performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={refetch}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <MoodCheckinModal 
            trigger={
              <Button variant="glow" className="shadow-glow">
                {todaysMood ? 'Update Mood' : 'Log Mood'}
              </Button>
            }
          />
        </div>
      </div>

      {/* Readiness Score Card */}
      <Card className="glow-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Main Score */}
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-muted/20"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${(readinessScore?.total || 50) * 3.77} 377`}
                strokeLinecap="round"
                className={getStatusColor(readinessScore?.status || 'moderate')}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getStatusColor(readinessScore?.status || 'moderate')}`}>
                {readinessScore?.total || '--'}
              </span>
              <span className="text-xs text-muted-foreground">READINESS</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Moon className="h-3 w-3 text-blue-500" /> Sleep
                </span>
                <span className="font-medium">{readinessScore?.sleep || '--'}%</span>
              </div>
              <Progress value={readinessScore?.sleep || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" /> Mood
                </span>
                <span className="font-medium">{readinessScore?.mood || '--'}%</span>
              </div>
              <Progress value={readinessScore?.mood || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" /> Stress
                </span>
                <span className="font-medium">{readinessScore?.stress || '--'}%</span>
              </div>
              <Progress value={readinessScore?.stress || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Recovery
                </span>
                <span className="font-medium">{readinessScore?.recovery || '--'}%</span>
              </div>
              <Progress value={readinessScore?.recovery || 0} className="h-2" />
            </div>
          </div>

          {/* Prediction */}
          <Card className={`p-4 ${getStatusBg(readinessScore?.status || 'moderate')}`}>
            <div className="text-center space-y-2">
              <div className="text-sm font-medium">Performance Prediction</div>
              <Badge variant={
                prediction.predictedPerformance === 'optimal' ? 'default' :
                prediction.predictedPerformance === 'above_average' ? 'secondary' : 'outline'
              }>
                {prediction.predictedPerformance.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {prediction.recommendation}
              </p>
            </div>
          </Card>
        </div>
      </Card>

      {/* Weekly Trends Chart */}
      {chartData.length > 0 && (
        <Card className="glow-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Weekly Mood Trends
          </h3>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#moodGradient)"
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="energy" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-primary" /> Mood
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" /> Energy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Stress
            </span>
          </div>
        </Card>
      )}

      {/* Discovered Patterns */}
      {correlations && correlations.dataPointsCount > 0 && (
        <Card className="glow-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Discovered Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {correlations.optimalSleepHours && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Optimal Sleep</span>
                </div>
                <p className="text-2xl font-bold">{correlations.optimalSleepHours}h</p>
                <p className="text-xs text-muted-foreground">
                  You perform best with this much sleep
                </p>
              </Card>
            )}
            {correlations.bestWorkoutTime && (
              <Card className="p-4 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Best Workout Time</span>
                </div>
                <p className="text-2xl font-bold capitalize">{correlations.bestWorkoutTime}</p>
                <p className="text-xs text-muted-foreground">
                  Your peak performance window
                </p>
              </Card>
            )}
            <Card className="p-4 bg-purple-500/10 border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm">Data Confidence</span>
              </div>
              <p className="text-2xl font-bold capitalize">{correlations.confidenceLevel}</p>
              <p className="text-xs text-muted-foreground">
                {correlations.dataPointsCount} data points collected
              </p>
            </Card>
          </div>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="glow-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Personalized Insights
          </h3>
          <div className="space-y-3">
            {insights.slice(0, 5).map(insight => (
              <Card 
                key={insight.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  insight.isRead ? 'opacity-60' : ''
                }`}
                onClick={() => markInsightRead(insight.id)}
              >
                <div className="flex items-start gap-3">
                  {insight.isActionable ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{insight.insightText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.insightType.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(insight.confidenceScore * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!todaysMood && !isLoading && (
        <Card className="glow-card p-8 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Tracking Your Mood</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Log your daily mood, energy, and stress levels to discover patterns 
            that optimize your workout performance.
          </p>
          <MoodCheckinModal 
            trigger={
              <Button variant="glow" size="lg">
                Log Your First Mood
              </Button>
            }
          />
        </Card>
      )}
    </div>
  );
}
