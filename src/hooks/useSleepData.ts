import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { startOfDay, subDays, format } from 'date-fns';
import { healthKitService } from '@/services/healthKitService';

export interface SleepLog {
  id: string;
  user_id: string;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  quality_score: number | null;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  light_sleep_minutes: number | null;
  awakenings: number;
  source: string;
  notes: string | null;
  created_at: string;
}

interface SleepStats {
  avgDuration: number;
  avgQuality: number;
  totalNights: number;
  streak: number;
}

export const useSleepData = () => {
  const { user } = useAuth();
  const [lastNightSleep, setLastNightSleep] = useState<SleepLog | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<SleepLog[]>([]);
  const [stats, setStats] = useState<SleepStats>({ avgDuration: 0, avgQuality: 0, totalNights: 0, streak: 0 });
  const [targetHours, setTargetHours] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate sleep score (0-100)
  const calculateSleepScore = useCallback((log: SleepLog): number => {
    if (!log.duration_minutes) return 0;
    
    const targetMinutes = targetHours * 60;
    const durationScore = Math.min(100, (log.duration_minutes / targetMinutes) * 100) * 0.4;
    const qualityScore = ((log.quality_score || 3) / 5) * 100 * 0.3;
    
    // Deep + REM should be ~40% of total sleep
    const deepRemMinutes = (log.deep_sleep_minutes || 0) + (log.rem_sleep_minutes || 0);
    const deepRemRatio = log.duration_minutes > 0 ? deepRemMinutes / log.duration_minutes : 0;
    const deepRemScore = Math.min(100, (deepRemRatio / 0.4) * 100) * 0.3;
    
    return Math.round(durationScore + qualityScore + deepRemScore);
  }, [targetHours]);

  // Fetch last night's sleep and weekly data
  const fetchSleepData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastNight = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      // Fetch last night's sleep (or today if logged early morning)
      const { data: recentSleep } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('sleep_date', [today, lastNight])
        .order('sleep_date', { ascending: false })
        .limit(1);

      if (recentSleep && recentSleep.length > 0) {
        setLastNightSleep(recentSleep[0] as SleepLog);
      }

      // Fetch weekly logs
      const { data: weekly } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('sleep_date', weekAgo)
        .order('sleep_date', { ascending: false });

      if (weekly) {
        setWeeklyLogs(weekly as SleepLog[]);
        
        // Calculate stats
        const validLogs = weekly.filter(l => l.duration_minutes && l.duration_minutes > 0);
        if (validLogs.length > 0) {
          const avgDuration = validLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / validLogs.length;
          const avgQuality = validLogs.reduce((sum, l) => sum + (l.quality_score || 3), 0) / validLogs.length;
          
          // Calculate streak
          let streak = 0;
          const sortedLogs = [...validLogs].sort((a, b) => 
            new Date(b.sleep_date).getTime() - new Date(a.sleep_date).getTime()
          );
          
          for (let i = 0; i < sortedLogs.length; i++) {
            const expectedDate = format(subDays(new Date(), i + 1), 'yyyy-MM-dd');
            if (sortedLogs.find(l => l.sleep_date === expectedDate)) {
              streak++;
            } else {
              break;
            }
          }
          
          setStats({
            avgDuration: Math.round(avgDuration),
            avgQuality: Math.round(avgQuality * 10) / 10,
            totalNights: validLogs.length,
            streak
          });
        }
      }

      // Fetch target hours from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_sleep_hours')
        .eq('id', user.id)
        .single();

      if (profile?.target_sleep_hours) {
        setTargetHours(Number(profile.target_sleep_hours));
      }
    } catch (error) {
      console.error('Error fetching sleep data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Log sleep entry
  const logSleep = async (data: {
    sleepDate: Date;
    bedtime: Date;
    wakeTime: Date;
    qualityScore: number;
    awakenings?: number;
    notes?: string;
    source?: string;
  }) => {
    if (!user?.id) return false;

    const durationMinutes = Math.round((data.wakeTime.getTime() - data.bedtime.getTime()) / (1000 * 60));
    const sleepDateStr = format(data.sleepDate, 'yyyy-MM-dd');

    // Optimistic update
    const optimisticLog: SleepLog = {
      id: crypto.randomUUID(),
      user_id: user.id,
      sleep_date: sleepDateStr,
      bedtime: data.bedtime.toISOString(),
      wake_time: data.wakeTime.toISOString(),
      duration_minutes: durationMinutes,
      quality_score: data.qualityScore,
      deep_sleep_minutes: null,
      rem_sleep_minutes: null,
      light_sleep_minutes: null,
      awakenings: data.awakenings || 0,
      source: data.source || 'manual',
      notes: data.notes || null,
      created_at: new Date().toISOString()
    };

    setLastNightSleep(optimisticLog);

    try {
      const { error } = await supabase.from('sleep_logs').upsert({
        user_id: user.id,
        sleep_date: sleepDateStr,
        bedtime: data.bedtime.toISOString(),
        wake_time: data.wakeTime.toISOString(),
        duration_minutes: durationMinutes,
        quality_score: data.qualityScore,
        awakenings: data.awakenings || 0,
        notes: data.notes,
        source: data.source || 'manual'
      }, { onConflict: 'user_id,sleep_date' });

      if (error) throw error;

      toast.success('🌙 Sleep logged!');
      fetchSleepData();
      return true;
    } catch (error) {
      console.error('Error logging sleep:', error);
      setLastNightSleep(null);
      toast.error('Failed to log sleep');
      return false;
    }
  };

  // Import from HealthKit
  const importFromHealthKit = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const sleepData = await healthKitService.fetchSleepData();
      
      if (!sleepData || !sleepData.bedtime || !sleepData.wakeTime) {
        toast.error('No sleep data found from Apple Watch');
        return false;
      }

      const durationMinutes = Math.round((new Date(sleepData.wakeTime).getTime() - new Date(sleepData.bedtime).getTime()) / (1000 * 60));
      const sleepDateStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      const { error } = await supabase.from('sleep_logs').upsert({
        user_id: user.id,
        sleep_date: sleepDateStr,
        bedtime: sleepData.bedtime,
        wake_time: sleepData.wakeTime,
        duration_minutes: durationMinutes,
        quality_score: sleepData.quality || 3,
        deep_sleep_minutes: sleepData.deepSleep,
        rem_sleep_minutes: sleepData.remSleep,
        light_sleep_minutes: sleepData.lightSleep,
        awakenings: sleepData.awakenings || 0,
        source: 'healthkit'
      }, { onConflict: 'user_id,sleep_date' });

      if (error) throw error;

      toast.success('⌚ Sleep imported from Apple Watch!');
      fetchSleepData();
      return true;
    } catch (error) {
      console.error('Error importing from HealthKit:', error);
      toast.error('Failed to import sleep data');
      return false;
    }
  };

  // Delete sleep log
  const deleteSleep = async (sleepDate: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('sleep_date', sleepDate);

      if (error) throw error;

      toast.success('Sleep log deleted');
      fetchSleepData();
      return true;
    } catch (error) {
      console.error('Error deleting sleep:', error);
      toast.error('Failed to delete sleep log');
      return false;
    }
  };

  // Update target sleep hours
  const updateTargetHours = async (hours: number) => {
    if (!user?.id) return false;

    setTargetHours(hours);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ target_sleep_hours: hours })
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating target hours:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSleepData();
  }, [fetchSleepData]);

  // Format duration for display
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDurationShort = (minutes: number | null): string => {
    if (!minutes) return '--';
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  };

  return {
    lastNightSleep,
    weeklyLogs,
    stats,
    targetHours,
    isLoading,
    logSleep,
    importFromHealthKit,
    deleteSleep,
    updateTargetHours,
    calculateSleepScore,
    formatDuration,
    formatDurationShort,
    refetch: fetchSleepData
  };
};
