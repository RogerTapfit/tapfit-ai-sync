import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIInsight {
  text: string;
  type: 'positive' | 'warning' | 'neutral';
}

interface AIInsightsResponse {
  insights: AIInsight[];
  timestamp: string;
  dataPoints: {
    workouts: number;
    powerLevel: number;
    trend: number;
  };
}

export const useAIInsights = (userId: string | undefined) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-insights', {
        body: { userId }
      });

      if (functionError) {
        throw functionError;
      }

      const response = data as AIInsightsResponse;
      setInsights(response.insights);
      setLastUpdated(response.timestamp);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      
      // Fallback to static insights if API fails
      setInsights([
        { text: "Welcome back! Ready to crush your workout goals today?", type: "positive" },
        { text: "Your consistency is building momentum. Keep it up!", type: "neutral" },
        { text: "Consider tracking your progressive overload for better results.", type: "neutral" },
        { text: "Recovery is just as important as training. Don't skip rest days!", type: "warning" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch insights on mount and when userId changes
  useEffect(() => {
    fetchInsights();
  }, [userId]);

  // Set up real-time updates when workout data changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('workout-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'smart_pin_data',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refetch insights when new workout data is added
          setTimeout(fetchInsights, 2000); // Small delay to ensure data is processed
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'power_level_history',
          filter: `user_id=eq.${userId}`
        },
        () => {
          setTimeout(fetchInsights, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Auto-refresh insights every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInsights();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [userId]);

  return {
    insights,
    loading,
    lastUpdated,
    error,
    refetch: fetchInsights
  };
};