import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Footprints } from "lucide-react";
import { format, subDays, isAfter, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthGuard";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ManualCardioLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManualCardioLogModal = ({ open, onOpenChange }: ManualCardioLogModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activityType, setActivityType] = useState<'walk' | 'run'>('walk');
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const [duration, setDuration] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = subDays(new Date(), 7);

  // Calculations
  const distanceNum = parseFloat(distance) || 0;
  const durationMinutes = parseFloat(duration) || 0;
  const distanceMeters = unit === 'km' ? distanceNum * 1000 : distanceNum * 1609.34;
  const durationSeconds = durationMinutes * 60;
  
  // Pace calculation (sec/km)
  const paceSecPerKm = distanceMeters > 0 ? (durationSeconds / (distanceMeters / 1000)) : 0;
  
  // Steps: 1300/km for walk, 1400/km for run
  const stepsPerKm = activityType === 'walk' ? 1300 : 1400;
  const estimatedSteps = Math.round((distanceMeters / 1000) * stepsPerKm);
  
  // Calories: rough estimate based on distance and activity
  const caloriesPerKm = activityType === 'walk' ? 50 : 65;
  const estimatedCalories = Math.round((distanceMeters / 1000) * caloriesPerKm);

  const formatPaceDisplay = (secPerKm: number) => {
    if (!secPerKm || !isFinite(secPerKm)) return '--:--';
    const totalSec = unit === 'mi' ? secPerKm * 1.60934 : secPerKm;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.round(totalSec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/${unit}`;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Please log in to save activities');
      return;
    }
    if (distanceNum <= 0) {
      toast.error('Please enter a valid distance');
      return;
    }
    if (durationMinutes <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create session with local date/time
      const sessionDate = startOfDay(selectedDate);
      const startedAt = new Date(sessionDate);
      startedAt.setHours(12, 0, 0, 0); // Default to noon
      const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      const { error } = await supabase.from('run_sessions').insert({
        user_id: user.id,
        activity_type: activityType,
        total_distance_m: Math.round(distanceMeters),
        moving_time_s: Math.round(durationSeconds),
        elapsed_time_s: Math.round(durationSeconds),
        avg_pace_sec_per_km: Math.round(paceSecPerKm),
        calories: estimatedCalories,
        unit,
        status: 'completed',
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
      });

      if (error) throw error;

      toast.success(`${activityType === 'walk' ? 'Walk' : 'Run'} logged! +${estimatedSteps.toLocaleString()} steps`);
      queryClient.invalidateQueries({ queryKey: ['run-history'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      
      // Reset form
      setDistance('');
      setDuration('');
      setSelectedDate(new Date());
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving manual activity:', error);
      toast.error('Failed to save activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Footprints className="h-5 w-5" />
            Log Activity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <ToggleGroup 
              type="single" 
              value={activityType} 
              onValueChange={(v) => v && setActivityType(v as 'walk' | 'run')}
              className="justify-start"
            >
              <ToggleGroupItem value="walk" className="flex-1">
                🚶 Walk
              </ToggleGroupItem>
              <ToggleGroupItem value="run" className="flex-1">
                🏃 Run
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <Label>Distance</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="flex-1"
              />
              <ToggleGroup 
                type="single" 
                value={unit} 
                onValueChange={(v) => v && setUnit(v as 'km' | 'mi')}
              >
                <ToggleGroupItem value="km" className="px-3">km</ToggleGroupItem>
                <ToggleGroupItem value="mi" className="px-3">mi</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => 
                    isAfter(date, new Date()) || 
                    !isAfter(date, subDays(minDate, 1))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview Stats */}
          {distanceNum > 0 && durationMinutes > 0 && (
            <div className={cn(
              "rounded-lg p-4 space-y-2",
              "bg-primary/5 border border-primary/20"
            )}>
              <p className="text-sm font-medium text-muted-foreground">Estimated</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-primary">{estimatedSteps.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Steps</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{formatPaceDisplay(paceSecPerKm)}</p>
                  <p className="text-xs text-muted-foreground">Pace</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-500">{estimatedCalories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || distanceNum <= 0 || durationMinutes <= 0}
            className="w-full"
          >
            {isSubmitting ? 'Saving...' : 'Log Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
