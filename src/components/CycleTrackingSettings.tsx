import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCycleTracking } from '@/hooks/useCycleTracking';
import { CalendarIcon, Moon, Droplets, Activity, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CycleTrackingSettingsProps {
  onClose?: () => void;
}

export const CycleTrackingSettings: React.FC<CycleTrackingSettingsProps> = ({ onClose }) => {
  const { cycleData, isLoading, createOrUpdate, isUpdating, calculatePhaseInfo, getCycleInsights } = useCycleTracking();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (cycleData) {
      setIsEnabled(cycleData.is_enabled);
      setCycleLength(cycleData.average_cycle_length);
      setPeriodLength(cycleData.average_period_length);
      setLastPeriodStart(new Date(cycleData.last_period_start));
    }
  }, [cycleData]);

  const handleSave = () => {
    if (!lastPeriodStart) return;

    createOrUpdate({
      is_enabled: isEnabled,
      average_cycle_length: cycleLength,
      average_period_length: periodLength,
      last_period_start: format(lastPeriodStart, 'yyyy-MM-dd'),
    });

    onClose?.();
  };

  const currentPhaseInfo = lastPeriodStart ? calculatePhaseInfo(new Date()) : null;
  const insights = currentPhaseInfo?.phase ? getCycleInsights(currentPhaseInfo.phase) : null;

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-primary" />
          Cycle Tracking Settings
        </CardTitle>
        <CardDescription>
          Track your menstrual cycle to get personalized fitness and nutrition insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="cycle-enabled" className="text-base font-medium">
              Enable Cycle Tracking
            </Label>
            <p className="text-sm text-muted-foreground">
              Get personalized insights based on your menstrual cycle
            </p>
          </div>
          <Switch
            id="cycle-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {isEnabled && (
          <>
            {/* Cycle Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycle-length">Average Cycle Length (days)</Label>
                <Input
                  id="cycle-length"
                  type="number"
                  min="21"
                  max="35"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                />
                <p className="text-xs text-muted-foreground">Typically 21-35 days</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-length">Average Period Length (days)</Label>
                <Input
                  id="period-length"
                  type="number"
                  min="3"
                  max="8"
                  value={periodLength}
                  onChange={(e) => setPeriodLength(parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">Typically 3-8 days</p>
              </div>
            </div>

            {/* Last Period Start Date */}
            <div className="space-y-2">
              <Label>Last Period Start Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lastPeriodStart ? format(lastPeriodStart, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={lastPeriodStart}
                    onSelect={(date) => {
                      setLastPeriodStart(date);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Current Phase Info */}
            {currentPhaseInfo && insights && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Current Phase:</span>
                      <span className="capitalize">{currentPhaseInfo.phase}</span>
                      {currentPhaseInfo.isInPeriod && <Droplets className="h-4 w-4 text-red-500" />}
                      {currentPhaseInfo.isOvulation && <Activity className="h-4 w-4 text-purple-500" />}
                    </div>
                    <p className="text-sm">{insights.phase_description}</p>
                    {insights.calorie_adjustment > 0 && (
                      <p className="text-sm text-orange-600">
                        Your metabolism is higher today (+{insights.calorie_adjustment} cal/day)
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Privacy Notice */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy:</strong> Your cycle data is private and secure. It's only used to provide 
                personalized insights and is never shared. You can disable tracking anytime.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};