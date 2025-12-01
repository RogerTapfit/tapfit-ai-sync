import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Droplets, Zap, Dumbbell, Utensils } from 'lucide-react';
import { useCycleTracking, CyclePhase } from '@/hooks/useCycleTracking';
import { CycleCalendarView } from './CycleCalendarView';
import { CycleTrackingSettings } from './CycleTrackingSettings';
import { CycleSetupFlow } from './CycleSetupFlow';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

interface CycleTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CycleTrackerModal = ({ open, onOpenChange }: CycleTrackerModalProps) => {
  const { cycleData, isEnabled, calculatePhaseInfo, getCycleInsights, createOrUpdate, isUpdating } = useCycleTracking();
  const [showSettings, setShowSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date());

  const today = new Date();
  const phaseInfo = calculatePhaseInfo(today);
  const insights = phaseInfo?.phase ? getCycleInsights(phaseInfo.phase) : null;

  // Generate cycle days for calendar
  const getCycleDaysForMonth = (monthDate: Date) => {
    if (!cycleData || !isEnabled) return [];

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return daysInMonth.map(date => {
      const dayPhaseInfo = calculatePhaseInfo(date);
      return {
        date,
        isPeriod: dayPhaseInfo?.isInPeriod || false,
        isFertile: dayPhaseInfo?.isFertileWindow || false,
        isOvulation: dayPhaseInfo?.isOvulation || false,
        isPredicted: date > today,
      };
    });
  };

  const cycleDays = getCycleDaysForMonth(currentViewMonth);

  const handleLogPeriodToday = () => {
    createOrUpdate({
      is_enabled: true,
      last_period_start: format(today, 'yyyy-MM-dd'),
      average_cycle_length: cycleData?.average_cycle_length || 28,
      average_period_length: cycleData?.average_period_length || 5,
    });
  };

  const handleDateClick = (date: Date) => {
    // Log period start on clicked date
    createOrUpdate({
      is_enabled: true,
      last_period_start: format(date, 'yyyy-MM-dd'),
      average_cycle_length: cycleData?.average_cycle_length || 28,
      average_period_length: cycleData?.average_period_length || 5,
    });
  };

  const getPhaseColor = (phase: CyclePhase | null) => {
    switch (phase) {
      case 'menstrual': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'follicular': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ovulation': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'luteal': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPhaseName = (phase: CyclePhase | null) => {
    switch (phase) {
      case 'menstrual': return 'Menstrual';
      case 'follicular': return 'Follicular';
      case 'ovulation': return 'Ovulation';
      case 'luteal': return 'Luteal';
      default: return 'Unknown';
    }
  };

  const getEnergyIcon = (level: string) => {
    switch (level) {
      case 'peak': return '⚡⚡⚡';
      case 'high': return '⚡⚡';
      case 'moderate': return '⚡';
      case 'low': return '💤';
      default: return '⚡';
    }
  };

  const handleSetupComplete = (startDate: Date, periodLength: number) => {
    createOrUpdate({
      is_enabled: true,
      last_period_start: format(startDate, 'yyyy-MM-dd'),
      average_cycle_length: cycleData?.average_cycle_length || 28,
      average_period_length: periodLength,
    });
    setShowSetup(false);
  };

  if (showSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <CycleTrackingSettings onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  if (showSetup || !isEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-pink-500" />
              Set Up Cycle Tracking
            </DialogTitle>
          </DialogHeader>
          <CycleSetupFlow 
            onComplete={handleSetupComplete}
            onCancel={() => {
              if (isEnabled) {
                setShowSetup(false);
              } else {
                onOpenChange(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-pink-500" />
              Cycle Tracker
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
            {/* Current Status Card */}
            <Card className="p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-2xl font-bold">Day {phaseInfo?.cycleDay || '--'}</p>
                  <p className="text-sm text-muted-foreground">
                    of {cycleData?.average_cycle_length || 28} day cycle
                  </p>
                </div>
                <Badge className={getPhaseColor(phaseInfo?.phase || null)}>
                  {getPhaseName(phaseInfo?.phase || null)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {phaseInfo?.daysUntilNext || '--'} days until next period
              </p>
            </Card>

            {/* Calendar */}
            <Card className="p-4">
              <CycleCalendarView 
                cycleDays={cycleDays}
                onDateClick={handleDateClick}
                lastPeriodStart={cycleData?.last_period_start ? new Date(cycleData.last_period_start) : undefined}
                onMonthChange={setCurrentViewMonth}
              />
            </Card>

            {/* Quick Log Button */}
            <Button 
              className="w-full bg-red-500/80 hover:bg-red-500"
              onClick={handleLogPeriodToday}
              disabled={isUpdating}
            >
              <Droplets className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Log Period Started Today'}
            </Button>

            {/* Insights Panel */}
            {insights && (
              <Card className="p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Today's Insights
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Energy Level</span>
                    <span className="font-medium">
                      {getEnergyIcon(insights.energy_level)} {insights.energy_level.toUpperCase()}
                    </span>
                  </div>
                  
                  {insights.calorie_adjustment > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Calorie Adjustment</span>
                      <span className="font-medium text-green-400">
                        +{insights.calorie_adjustment} cal/day
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {insights.phase_description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Dumbbell className="h-3 w-3" />
                      Best Workouts
                    </div>
                    <p className="text-xs">
                      {insights.workout_recommendations.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Utensils className="h-3 w-3" />
                      Nutrition Tips
                    </div>
                    <p className="text-xs">
                      {insights.nutrition_tips.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
};
