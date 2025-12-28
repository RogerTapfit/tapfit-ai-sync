import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { getLocalDateString, getLocalDateDaysAgo } from '@/utils/dateUtils';

export interface MoodEntry {
  id?: string;
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  motivationLevel: number;
  moodTags: string[];
  notes?: string;
  context: 'pre_workout' | 'post_workout' | 'morning' | 'evening' | 'general';
  heartRateBpm?: number;
  sleepHoursLastNight?: number;
  sleepQualityLastNight?: number;
  entryDate?: string;
  createdAt?: string;
}

export interface ReadinessScore {
  total: number;
  sleep: number;
  mood: number;
  stress: number;
  recovery: number;
  status: 'optimal' | 'moderate' | 'low';
}

export interface PerformanceCorrelations {
  sleepDurationCorrelation: number | null;
  sleepQualityCorrelation: number | null;
  moodScoreCorrelation: number | null;
  energyLevelCorrelation: number | null;
  stressLevelCorrelation: number | null;
  optimalSleepHours: number | null;
  bestWorkoutTime: string | null;
  bestWorkoutDay: string | null;
  confidenceLevel: 'low' | 'medium' | 'high';
  dataPointsCount: number;
}

export interface BiometricInsight {
  id: string;
  insightType: string;
  insightText: string;
  confidenceScore: number;
  dataSource: string[];
  isRead: boolean;
  isActionable: boolean;
  createdAt: string;
}

export function useBiometricMood() {
  const { user, loading: authLoading } = useAuth();
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [weeklyMoods, setWeeklyMoods] = useState<MoodEntry[]>([]);
  const [readinessScore, setReadinessScore] = useState<ReadinessScore | null>(null);
  const [correlations, setCorrelations] = useState<PerformanceCorrelations | null>(null);
  const [insights, setInsights] = useState<BiometricInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodaysMood = useCallback(async () => {
    if (!user?.id) return;

    const today = getLocalDateString();
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setTodaysMood({
        id: data.id,
        moodScore: data.mood_score || 5,
        energyLevel: data.energy_level || 5,
        stressLevel: data.stress_level || 5,
        motivationLevel: data.motivation_level || 5,
        moodTags: data.mood_tags || [],
        notes: data.notes || undefined,
        context: data.entry_context as MoodEntry['context'] || 'general',
        heartRateBpm: data.heart_rate_bpm || undefined,
        sleepHoursLastNight: data.sleep_hours_last_night ? Number(data.sleep_hours_last_night) : undefined,
        sleepQualityLastNight: data.sleep_quality_last_night || undefined,
        entryDate: data.entry_date,
        createdAt: data.created_at
      });
    } else {
      setTodaysMood(null);
    }
  }, [user?.id]);

  const fetchWeeklyMoods = useCallback(async () => {
    if (!user?.id) return;

    const weekAgoStr = getLocalDateDaysAgo(7);

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', weekAgoStr)
      .order('entry_date', { ascending: true });

    if (data && !error) {
      setWeeklyMoods(data.map(d => ({
        id: d.id,
        moodScore: d.mood_score || 5,
        energyLevel: d.energy_level || 5,
        stressLevel: d.stress_level || 5,
        motivationLevel: d.motivation_level || 5,
        moodTags: d.mood_tags || [],
        notes: d.notes || undefined,
        context: d.entry_context as MoodEntry['context'] || 'general',
        entryDate: d.entry_date,
        createdAt: d.created_at
      })));
    }
  }, [user?.id]);

  const fetchReadinessScore = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .rpc('calculate_readiness_score', { _user_id: user.id });

    if (data && !error && typeof data === 'object' && data !== null) {
      const score = data as unknown as ReadinessScore;
      setReadinessScore(score);
    }
  }, [user?.id]);

  const fetchCorrelations = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('workout_performance_correlations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && !error) {
      setCorrelations({
        sleepDurationCorrelation: data.sleep_duration_correlation ? Number(data.sleep_duration_correlation) : null,
        sleepQualityCorrelation: data.sleep_quality_correlation ? Number(data.sleep_quality_correlation) : null,
        moodScoreCorrelation: data.mood_score_correlation ? Number(data.mood_score_correlation) : null,
        energyLevelCorrelation: data.energy_level_correlation ? Number(data.energy_level_correlation) : null,
        stressLevelCorrelation: data.stress_level_correlation ? Number(data.stress_level_correlation) : null,
        optimalSleepHours: data.optimal_sleep_hours ? Number(data.optimal_sleep_hours) : null,
        bestWorkoutTime: data.best_workout_time,
        bestWorkoutDay: data.best_workout_day,
        confidenceLevel: (data.confidence_level as 'low' | 'medium' | 'high') || 'low',
        dataPointsCount: data.data_points_count || 0
      });
    }
  }, [user?.id]);

  const fetchInsights = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('biometric_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setInsights(data.map(d => ({
        id: d.id,
        insightType: d.insight_type,
        insightText: d.insight_text,
        confidenceScore: Number(d.confidence_score) || 0,
        dataSource: d.data_source || [],
        isRead: d.is_read || false,
        isActionable: d.is_actionable || false,
        createdAt: d.created_at
      })));
    }
  }, [user?.id]);

  const logMood = useCallback(async (entry: Omit<MoodEntry, 'id' | 'entryDate' | 'createdAt'>) => {
    if (!user?.id) {
      console.error('Cannot save mood: User not authenticated');
      toast.error('Please sign in to save your mood');
      return false;
    }

    const today = getLocalDateString();
    const now = new Date().toTimeString().split(' ')[0];

    const { error } = await supabase
      .from('mood_entries')
      .upsert({
        user_id: user.id,
        entry_date: today,
        entry_time: now,
        mood_score: entry.moodScore,
        energy_level: entry.energyLevel,
        stress_level: entry.stressLevel,
        motivation_level: entry.motivationLevel,
        mood_tags: entry.moodTags,
        notes: entry.notes,
        entry_context: entry.context,
        heart_rate_bpm: entry.heartRateBpm,
        sleep_hours_last_night: entry.sleepHoursLastNight,
        sleep_quality_last_night: entry.sleepQualityLastNight
      }, {
        onConflict: 'user_id,entry_date,entry_context'
      });

    if (error) {
      console.error('Error logging mood:', error);
      toast.error('Failed to save mood entry');
      return false;
    }

    toast.success('Mood logged successfully');
    
    // Dispatch mood:updated event for cross-component sync
    window.dispatchEvent(new CustomEvent('mood:updated', {
      detail: {
        moodScore: entry.moodScore,
        energyLevel: entry.energyLevel,
        stressLevel: entry.stressLevel,
        motivationLevel: entry.motivationLevel
      }
    }));
    
    await fetchTodaysMood();
    await fetchWeeklyMoods();
    await fetchReadinessScore();
    await fetchInsights();
    return true;
  }, [user?.id, fetchTodaysMood, fetchWeeklyMoods, fetchReadinessScore, fetchInsights]);

  const markInsightRead = useCallback(async (insightId: string) => {
    if (!user?.id) return;

    await supabase
      .from('biometric_insights')
      .update({ is_read: true })
      .eq('id', insightId)
      .eq('user_id', user.id);

    setInsights(prev => prev.map(i => 
      i.id === insightId ? { ...i, isRead: true } : i
    ));
  }, [user?.id]);

  const getPerformancePrediction = useCallback(() => {
    if (!readinessScore) {
      return {
        predictedPerformance: 'average' as const,
        confidenceScore: 0.3,
        recommendation: 'Log your mood and sleep to get personalized predictions'
      };
    }

    const { total, sleep, mood, stress, recovery } = readinessScore;
    
    let prediction: 'poor' | 'below_average' | 'average' | 'above_average' | 'optimal';
    let recommendation: string;

    if (total >= 80) {
      prediction = 'optimal';
      recommendation = 'Perfect conditions for a PR attempt! 🔥';
    } else if (total >= 65) {
      prediction = 'above_average';
      recommendation = 'Great day for a solid workout';
    } else if (total >= 50) {
      prediction = 'average';
      recommendation = 'Normal workout expected';
    } else if (total >= 35) {
      prediction = 'below_average';
      recommendation = 'Consider a lighter workout today';
    } else {
      prediction = 'poor';
      recommendation = 'Rest day recommended - your body needs recovery';
    }

    // Add specific recommendations based on lowest factors
    const factors = [
      { name: 'sleep', value: sleep },
      { name: 'mood', value: mood },
      { name: 'stress', value: stress },
      { name: 'recovery', value: recovery }
    ].sort((a, b) => a.value - b.value);

    const lowestFactor = factors[0];
    if (lowestFactor.value < 50) {
      if (lowestFactor.name === 'sleep') {
        recommendation += ' (Low sleep detected)';
      } else if (lowestFactor.name === 'stress') {
        recommendation += ' (High stress - try some mobility work)';
      }
    }

    return {
      predictedPerformance: prediction,
      confidenceScore: todaysMood ? 0.8 : 0.4,
      recommendation
    };
  }, [readinessScore, todaysMood]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      Promise.all([
        fetchTodaysMood(),
        fetchWeeklyMoods(),
        fetchReadinessScore(),
        fetchCorrelations(),
        fetchInsights()
      ]).finally(() => setIsLoading(false));
    }
  }, [user?.id, fetchTodaysMood, fetchWeeklyMoods, fetchReadinessScore, fetchCorrelations, fetchInsights]);

  // Listen for mood:updated events from other components
  useEffect(() => {
    const handleMoodUpdate = () => {
      console.log('useBiometricMood: mood:updated event received, refreshing data...');
      fetchTodaysMood();
      fetchWeeklyMoods();
      fetchReadinessScore();
      fetchInsights();
    };

    window.addEventListener('mood:updated', handleMoodUpdate);
    return () => window.removeEventListener('mood:updated', handleMoodUpdate);
  }, [fetchTodaysMood, fetchWeeklyMoods, fetchReadinessScore, fetchInsights]);

  // Real-time subscription for mood_entries changes
  useEffect(() => {
    if (!user?.id) return;

    const moodEntriesChannel = supabase
      .channel('mood_entries_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('useBiometricMood: mood_entries table changed, refreshing...');
          fetchTodaysMood();
          fetchWeeklyMoods();
          fetchReadinessScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(moodEntriesChannel);
    };
  }, [user?.id, fetchTodaysMood, fetchWeeklyMoods, fetchReadinessScore]);

  return {
    todaysMood,
    weeklyMoods,
    readinessScore,
    correlations,
    insights,
    isLoading,
    authLoading,
    logMood,
    markInsightRead,
    getPerformancePrediction,
    refetch: () => {
      fetchTodaysMood();
      fetchWeeklyMoods();
      fetchReadinessScore();
      fetchCorrelations();
      fetchInsights();
    }
  };
}
