import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, Plus, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { habitNotificationService } from '@/services/habitNotificationService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HabitReminderSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitId: string;
  habitName: string;
  habitIcon: string;
  initialEnabled: boolean;
  initialTimes: string[];
  initialDays: number[];
  onSave: () => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESETS = [
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
  { label: 'Every Day', days: [0, 1, 2, 3, 4, 5, 6] },
];

export const HabitReminderSettings = ({
  open,
  onOpenChange,
  habitId,
  habitName,
  habitIcon,
  initialEnabled,
  initialTimes,
  initialDays,
  onSave,
}: HabitReminderSettingsProps) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [times, setTimes] = useState<string[]>(initialTimes.length > 0 ? initialTimes : ['08:00']);
  const [days, setDays] = useState<number[]>(initialDays.length > 0 ? initialDays : [0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  // Reset state when habit changes
  useEffect(() => {
    setEnabled(initialEnabled);
    setTimes(initialTimes.length > 0 ? initialTimes : ['08:00']);
    setDays(initialDays.length > 0 ? initialDays : [0, 1, 2, 3, 4, 5, 6]);
  }, [habitId, initialEnabled, initialTimes, initialDays]);

  const handleToggleDay = (day: number) => {
    setDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleAddTime = () => {
    if (times.length < 4) {
      setTimes(prev => [...prev, '12:00']);
    }
  };

  const handleRemoveTime = (index: number) => {
    if (times.length > 1) {
      setTimes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    setTimes(prev => prev.map((t, i) => i === index ? value : t));
  };

  const handlePresetClick = (presetDays: number[]) => {
    setDays(presetDays);
  };

  const handleEnableChange = async (value: boolean) => {
    if (value) {
      // Request notification permission when enabling
      const granted = await habitNotificationService.requestPermission();
      if (!granted) {
        toast.error('Please enable notifications in your browser settings');
        return;
      }
    }
    setEnabled(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_habits')
        .update({
          reminder_enabled: enabled,
          reminder_times: times,
          reminder_days: days,
        })
        .eq('id', habitId);

      if (error) throw error;

      toast.success(enabled ? 'Reminder saved!' : 'Reminder disabled');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast.error('Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Reminder Settings
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Habit preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <span className="text-2xl">{habitIcon}</span>
            <span className="font-medium">{habitName}</span>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-enabled" className="text-base">Enable Reminders</Label>
            <Switch
              id="reminder-enabled"
              checked={enabled}
              onCheckedChange={handleEnableChange}
            />
          </div>

          {enabled && (
            <>
              {/* Day presets */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Quick Select</Label>
                <div className="flex gap-2">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant={JSON.stringify(days) === JSON.stringify(preset.days) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetClick(preset.days)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Day selector */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Days</Label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, index) => (
                    <button
                      key={index}
                      onClick={() => handleToggleDay(index)}
                      className={cn(
                        "w-10 h-10 rounded-full font-medium text-sm transition-all",
                        days.includes(index)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      title={DAY_FULL_LABELS[index]}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time pickers */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Reminder Time{times.length > 1 ? 's' : ''}
                </Label>
                <div className="space-y-2">
                  {times.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="flex-1"
                      />
                      {times.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTime(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {times.length < 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTime}
                    className="mt-2 text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add another time
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Save button */}
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Reminder'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
