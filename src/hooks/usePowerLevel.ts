import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PowerLevel {
  id: string;
  user_id: string;
  current_score: number;
  current_tier: string;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface PowerLevelHistory {
  id: string;
  user_id: string;
  score: number;
  tier: string;
  date: string;
  factors: any;
  created_at: string;
}

export const usePowerLevel = () => {
  const [powerLevel, setPowerLevel] = useState<PowerLevel | null>(null);
  const [history, setHistory] = useState<PowerLevelHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPowerLevel();
    fetchHistory();
  }, []);

  const fetchPowerLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_power_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setPowerLevel(data);
    } catch (error) {
      console.error('Error fetching power level:', error);
      setError('Failed to fetch power level');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('power_level_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching power level history:', error);
    }
  };

  const refreshPowerLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('update_user_power_level', {
        _user_id: user.id
      });

      if (error) throw error;

      // Refresh the data
      await fetchPowerLevel();
      await fetchHistory();
      
      return true;
    } catch (error) {
      console.error('Error refreshing power level:', error);
      return false;
    }
  };

  const getTierInfo = (tier: string) => {
    const tiers = {
      inactive: { 
        name: 'Inactive', 
        color: 'bg-gray-500', 
        range: '0-199',
        description: 'Get started with your fitness journey!'
      },
      inconsistent: { 
        name: 'Inconsistent', 
        color: 'bg-red-500', 
        range: '200-399',
        description: 'Building habits, keep pushing forward!'
      },
      improving: { 
        name: 'Improving', 
        color: 'bg-yellow-500', 
        range: '400-599',
        description: 'Great progress, you\'re on the right track!'
      },
      strong: { 
        name: 'Strong', 
        color: 'bg-blue-500', 
        range: '600-799',
        description: 'Impressive consistency and dedication!'
      },
      elite: { 
        name: 'Elite', 
        color: 'bg-purple-500', 
        range: '800-1000',
        description: 'Peak performance level achieved!'
      }
    };
    return tiers[tier as keyof typeof tiers] || tiers.inactive;
  };

  const getScoreBreakdown = () => {
    if (!history.length) return null;
    
    const latest = history[0];
    return latest.factors || {};
  };

  const getSuggestions = (score: number, tier: string) => {
    const suggestions = [];
    
    if (score < 400) {
      suggestions.push('Complete 3+ workouts this week to boost your consistency score');
      suggestions.push('Log your meals daily to improve your nutrition score');
    }
    
    if (score < 600) {
      suggestions.push('Join a challenge to earn extra points');
      suggestions.push('Maintain a 7-day workout streak for maximum consistency');
    }
    
    if (score < 800) {
      suggestions.push('Complete advanced challenges for bonus points');
      suggestions.push('Track nutrition for 20+ days this month');
    }
    
    return suggestions;
  };

  return {
    powerLevel,
    history,
    loading,
    error,
    refreshPowerLevel,
    getTierInfo,
    getScoreBreakdown,
    getSuggestions
  };
};