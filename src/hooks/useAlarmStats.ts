import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AlarmStats {
  totalAlarms: number;
  totalCompletions: number;
  completionRate: number;
  averageTimeToComplete: number;
  currentStreak: number;
  longestStreak: number;
  recentCompletions: AlarmCompletion[];
  completionsByAlarm: Record<string, {
    alarmLabel: string;
    completions: number;
    avgTime: number;
  }>;
}

export interface AlarmCompletion {
  id: string;
  alarm_id: string;
  completed_at: string;
  push_ups_completed: number;
  time_to_complete: number;
  alarm?: {
    label: string;
    alarm_time: string;
  };
}

export const useAlarmStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['alarm-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all alarms
      const { data: alarms, error: alarmsError } = await supabase
        .from('fitness_alarms')
        .select('*')
        .eq('user_id', user.id);

      if (alarmsError) throw alarmsError;

      // Fetch all completions with alarm info
      const { data: completions, error: completionsError } = await supabase
        .from('alarm_completions')
        .select(`
          *,
          alarm:fitness_alarms(label, alarm_time)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      const totalAlarms = alarms?.length || 0;
      const totalCompletions = completions?.length || 0;

      // Calculate completion rate (unique days with completions vs total possible days)
      const daysWithCompletions = new Set(
        completions?.map(c => new Date(c.completed_at).toDateString())
      ).size;

      // Calculate average time to complete
      const avgTime = completions?.length
        ? completions.reduce((sum, c) => sum + (c.time_to_complete || 0), 0) / completions.length
        : 0;

      // Calculate streaks
      const sortedCompletions = [...(completions || [])].sort(
        (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      sortedCompletions.forEach((completion) => {
        const completionDate = new Date(completion.completed_at);
        completionDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
          // First completion
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (
            completionDate.getTime() === today.getTime() ||
            completionDate.getTime() === yesterday.getTime()
          ) {
            currentStreak = 1;
            tempStreak = 1;
          }
        } else {
          const dayDiff = Math.floor(
            (lastDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
            // Consecutive day
            tempStreak++;
            if (currentStreak > 0) currentStreak++;
          } else if (dayDiff > 1) {
            // Streak broken
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
            currentStreak = 0;
          }
        }

        lastDate = completionDate;
      });

      longestStreak = Math.max(longestStreak, tempStreak);

      // Group completions by alarm
      const completionsByAlarm: Record<string, any> = {};
      completions?.forEach((completion) => {
        const alarmId = completion.alarm_id;
        if (!completionsByAlarm[alarmId]) {
          completionsByAlarm[alarmId] = {
            alarmLabel: completion.alarm?.label || 'Unnamed Alarm',
            completions: 0,
            totalTime: 0,
            avgTime: 0,
          };
        }
        completionsByAlarm[alarmId].completions++;
        completionsByAlarm[alarmId].totalTime += completion.time_to_complete || 0;
      });

      // Calculate averages
      Object.keys(completionsByAlarm).forEach((alarmId) => {
        const alarm = completionsByAlarm[alarmId];
        alarm.avgTime = alarm.totalTime / alarm.completions;
        delete alarm.totalTime;
      });

      const completionRate = totalAlarms > 0 
        ? Math.round((totalCompletions / (totalAlarms * 30)) * 100) // Rough estimate: alarms in last 30 days
        : 0;

      return {
        totalAlarms,
        totalCompletions,
        completionRate,
        averageTimeToComplete: Math.round(avgTime),
        currentStreak,
        longestStreak,
        recentCompletions: completions?.slice(0, 10) || [],
        completionsByAlarm,
      } as AlarmStats;
    },
  });

  return { stats, isLoading };
};
