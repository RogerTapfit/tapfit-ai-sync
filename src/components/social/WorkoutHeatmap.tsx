import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval, startOfDay, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkoutHeatmapProps {
  userId: string;
  months?: number;
}

interface DayActivity {
  date: Date;
  count: number;
}

export function WorkoutHeatmap({ userId, months = 6 }: WorkoutHeatmapProps) {
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutActivity();
  }, [userId, months]);

  const fetchWorkoutActivity = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, months * 30);

      // Fetch workout logs within date range
      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select('completed_at, started_at')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      if (error) throw error;

      // Create a map of dates to workout counts
      const countsByDate = new Map<string, number>();
      
      workoutLogs?.forEach((workout) => {
        const workoutDate = workout.completed_at || workout.started_at;
        if (workoutDate) {
          const date = format(startOfDay(new Date(workoutDate)), 'yyyy-MM-dd');
          countsByDate.set(date, (countsByDate.get(date) || 0) + 1);
        }
      });

      // Generate all days in range with their counts
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const activities = allDays.map((date) => ({
        date,
        count: countsByDate.get(format(date, 'yyyy-MM-dd')) || 0,
      }));

      setActivityData(activities);
    } catch (error) {
      console.error('Error fetching workout activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorIntensity = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count === 1) return 'bg-red-500/20';
    if (count === 2) return 'bg-red-500/40';
    if (count === 3) return 'bg-red-500/60';
    if (count === 4) return 'bg-red-500/80';
    return 'bg-red-500';
  };

  // Group days by week
  const weeks: DayActivity[][] = [];
  let currentWeek: DayActivity[] = [];
  
  activityData.forEach((day, index) => {
    currentWeek.push(day);
    
    // Start new week on Sunday or at the end
    if (day.date.getDay() === 6 || index === activityData.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Fill first week with empty days if needed
  if (weeks[0] && weeks[0][0].date.getDay() !== 0) {
    const firstWeek = weeks[0];
    const emptyDays = firstWeek[0].date.getDay();
    for (let i = 0; i < emptyDays; i++) {
      firstWeek.unshift({ date: new Date(0), count: -1 }); // -1 indicates empty cell
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-sm text-muted-foreground">Loading activity...</div>
      </div>
    );
  }

  const totalWorkouts = activityData.reduce((sum, day) => sum + day.count, 0);
  const activeDays = activityData.filter((day) => day.count > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground">{totalWorkouts}</span> workouts in the last {months} months
        </div>
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground">{activeDays}</span> active days
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <TooltipProvider>
          <div className="inline-flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (day.count === -1) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-red-500/50 ${getColorIntensity(
                            day.count
                          )}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="font-medium">
                            {day.count} {day.count === 1 ? 'workout' : 'workouts'}
                          </div>
                          <div className="text-muted-foreground">
                            {format(day.date, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-red-500/20" />
          <div className="w-3 h-3 rounded-sm bg-red-500/40" />
          <div className="w-3 h-3 rounded-sm bg-red-500/60" />
          <div className="w-3 h-3 rounded-sm bg-red-500/80" />
          <div className="w-3 h-3 rounded-sm bg-red-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
