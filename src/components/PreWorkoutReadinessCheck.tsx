import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBiometricMood } from '@/hooks/useBiometricMood';
import { MoodCheckinModal } from './MoodCheckinModal';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Moon, 
  Heart, 
  Zap, 
  Brain,
  ChevronRight
} from 'lucide-react';

interface PreWorkoutReadinessCheckProps {
  onProceed: () => void;
  onSkip?: () => void;
}

export function PreWorkoutReadinessCheck({ onProceed, onSkip }: PreWorkoutReadinessCheckProps) {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const { readinessScore, todaysMood, getPerformancePrediction, refetch } = useBiometricMood();

  const prediction = getPerformancePrediction();

  const getTrafficLight = () => {
    if (!readinessScore) return { color: 'yellow', icon: AlertTriangle, label: 'Unknown' };
    if (readinessScore.total >= 70) return { color: 'green', icon: CheckCircle, label: 'Go!' };
    if (readinessScore.total >= 45) return { color: 'yellow', icon: AlertTriangle, label: 'Caution' };
    return { color: 'red', icon: XCircle, label: 'Rest' };
  };

  const trafficLight = getTrafficLight();
  const TrafficIcon = trafficLight.icon;

  const handleMoodComplete = () => {
    setShowMoodModal(false);
    refetch();
  };

  return (
    <Card className="glow-card p-6 max-w-md mx-auto">
      <div className="text-center space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold flex items-center justify-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Pre-Workout Check
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            How ready is your body for today's workout?
          </p>
        </div>

        {/* Traffic Light Indicator */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
            trafficLight.color === 'green' ? 'bg-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
            trafficLight.color === 'yellow' ? 'bg-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.4)]' :
            'bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
          }`}>
            <TrafficIcon className={`h-12 w-12 ${
              trafficLight.color === 'green' ? 'text-green-500' :
              trafficLight.color === 'yellow' ? 'text-yellow-500' :
              'text-red-500'
            }`} />
          </div>
          <div className="mt-3">
            <span className={`text-3xl font-bold ${
              trafficLight.color === 'green' ? 'text-green-500' :
              trafficLight.color === 'yellow' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {readinessScore?.total || '--'}%
            </span>
            <Badge variant="outline" className="ml-2">
              {trafficLight.label}
            </Badge>
          </div>
        </div>

        {/* Breakdown Bars */}
        <div className="space-y-3 text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                Sleep
              </span>
              <span className="font-medium">{readinessScore?.sleep || '--'}%</span>
            </div>
            <Progress 
              value={readinessScore?.sleep || 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Mood
              </span>
              <span className="font-medium">{readinessScore?.mood || '--'}%</span>
            </div>
            <Progress 
              value={readinessScore?.mood || 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Low Stress
              </span>
              <span className="font-medium">{readinessScore?.stress || '--'}%</span>
            </div>
            <Progress 
              value={readinessScore?.stress || 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Recovery
              </span>
              <span className="font-medium">{readinessScore?.recovery || '--'}%</span>
            </div>
            <Progress 
              value={readinessScore?.recovery || 0} 
              className="h-2"
            />
          </div>
        </div>

        {/* AI Recommendation */}
        <Card className={`p-4 ${
          trafficLight.color === 'green' ? 'bg-green-500/10 border-green-500/20' :
          trafficLight.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20' :
          'bg-red-500/10 border-red-500/20'
        }`}>
          <p className="text-sm font-medium">{prediction.recommendation}</p>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {!todaysMood && (
            <MoodCheckinModal
              context="pre_workout"
              trigger={
                <Button variant="outline" className="w-full">
                  <Heart className="h-4 w-4 mr-2" />
                  Log Mood First
                </Button>
              }
              onComplete={handleMoodComplete}
            />
          )}

          <Button 
            variant="glow" 
            className="w-full shadow-glow"
            onClick={onProceed}
          >
            Start Workout
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>

          {onSkip && (
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={onSkip}
            >
              Skip Check
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
