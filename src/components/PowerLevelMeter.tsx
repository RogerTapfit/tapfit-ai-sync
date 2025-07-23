import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Zap, 
  Trophy, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  HelpCircle,
  Activity,
  Apple,
  Calendar
} from 'lucide-react';
import { usePowerLevel } from '@/hooks/usePowerLevel';

interface PowerLevelMeterProps {
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}

export const PowerLevelMeter = ({ 
  size = 'medium', 
  showDetails = true, 
  className = '' 
}: PowerLevelMeterProps) => {
  const { 
    powerLevel, 
    history, 
    loading, 
    refreshPowerLevel, 
    getTierInfo, 
    getScoreBreakdown,
    getSuggestions 
  } = usePowerLevel();

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!powerLevel) {
    return (
      <Card className={`${className} glow-card`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Power Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Start your fitness journey to unlock your Power Level!</p>
            <Button onClick={refreshPowerLevel} className="glow-button">
              <Activity className="h-4 w-4 mr-2" />
              Calculate Power Level
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = getTierInfo(powerLevel.current_tier);
  const percentage = (powerLevel.current_score / 1000) * 100;
  const breakdown = getScoreBreakdown();
  const suggestions = getSuggestions(powerLevel.current_score, powerLevel.current_tier);

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const meterSizes = {
    small: 'h-24 w-24',
    medium: 'h-32 w-32', 
    large: 'h-40 w-40'
  };

  return (
    <Card className={`${className} glow-card`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Power Level
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-2">How Power Level is Calculated:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Workouts: Up to 400 points</li>
                      <li>• Nutrition: Up to 200 points</li>
                      <li>• Consistency: Up to 250 points</li>
                      <li>• Challenges: Up to 150 points</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshPowerLevel}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Power Level Display */}
        <div className="flex items-center justify-center">
          <div className={`${meterSizes[size]} relative`}>
            {/* Circular Progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted stroke-current opacity-20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                className={`${tierInfo.color.replace('bg-', 'text-')} stroke-current transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${tierInfo.color.replace('bg-', 'text-')}`}>
                {powerLevel.current_score}
              </div>
              <div className="text-xs text-muted-foreground">/ 1000</div>
            </div>
          </div>
        </div>

        {/* Tier Badge and Info */}
        <div className="text-center space-y-2">
          <Badge 
            className={`${tierInfo.color} text-white px-4 py-1 text-sm font-semibold`}
            variant="secondary"
          >
            <Trophy className="h-3 w-3 mr-1" />
            {tierInfo.name}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {tierInfo.description}
          </p>
          <p className="text-xs text-muted-foreground">
            Range: {tierInfo.range} points
          </p>
        </div>

        {showDetails && (
          <>
            {/* Score Breakdown */}
            {breakdown && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Score Breakdown (Last 30 Days)
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <div className="font-semibold">{breakdown.workout_days || 0}</div>
                    <div className="text-muted-foreground">Workout Days</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Apple className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <div className="font-semibold">{breakdown.nutrition_days || 0}</div>
                    <div className="text-muted-foreground">Nutrition Days</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                    <div className="font-semibold">{breakdown.completed_challenges || 0}</div>
                    <div className="text-muted-foreground">Challenges</div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress History */}
            {history.length > 1 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Progress
                </h4>
                <div className="space-y-2">
                  {history.slice(0, 5).map((entry, index) => {
                    const prevEntry = history[index + 1];
                    const change = prevEntry ? entry.score - prevEntry.score : 0;
                    const tierInfo = getTierInfo(entry.tier);
                    
                    return (
                      <div key={entry.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0 ${tierInfo.color.replace('bg-', 'border-')}`}
                          >
                            {entry.score}
                          </Badge>
                          {change !== 0 && (
                            <span className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change > 0 ? '+' : ''}{change}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">How to Improve</h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="text-xs p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <p>{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};