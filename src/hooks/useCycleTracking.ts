import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export interface CycleTracking {
  id: string;
  user_id: string;
  is_enabled: boolean;
  average_cycle_length: number;
  average_period_length: number;
  last_period_start: string;
  created_at: string;
  updated_at: string;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CyclePhaseInfo {
  phase: CyclePhase | null;
  cycleDay: number;
  daysUntilNext: number;
  isInPeriod: boolean;
  isOvulation: boolean;
  isFertileWindow: boolean;
}

export interface CycleInsights {
  energy_level: 'low' | 'moderate' | 'high' | 'peak';
  calorie_adjustment: number;
  workout_recommendations: string[];
  nutrition_tips: string[];
  phase_description: string;
}

export const useCycleTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cycleData, isLoading } = useQuery({
    queryKey: ['cycle-tracking', user?.id],
    queryFn: async () => {
      // Get fresh session directly from Supabase to avoid race conditions
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('cycle_tracking')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cycle data:', error);
        return null;
      }

      return data as CycleTracking | null;
    },
    enabled: !!user?.id,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: Partial<CycleTracking> & { last_period_start: string }) => {
      // Get fresh session directly from Supabase to avoid race conditions
      let { data: { session } } = await supabase.auth.getSession();
      
      // If no session, try refreshing the token
      if (!session?.user) {
        console.log('No session from getSession, attempting refresh...');
        const refreshResult = await supabase.auth.refreshSession();
        session = refreshResult.data.session;
      }
      
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error('Authentication failed - no user ID after refresh attempt');
        throw new Error('Session expired. Please refresh the page or log in again.');
      }

      const payload = {
        user_id: userId,
        ...data,
      };

      const { data: result, error } = await supabase
        .from('cycle_tracking')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-tracking'] });
      toast.success('Cycle tracking settings updated');
    },
    onError: (error: Error) => {
      console.error('Error updating cycle tracking:', error);
      if (error.message.includes('Session expired') || error.message.includes('not authenticated')) {
        toast.error('Session expired. Please refresh the page or log in again.');
      } else {
        toast.error('Failed to save cycle settings. Please try again.');
      }
    },
  });

  const calculatePhaseInfo = (date: Date): CyclePhaseInfo | null => {
    if (!cycleData || !cycleData.is_enabled) {
      return null;
    }

    const lastPeriodStart = new Date(cycleData.last_period_start);
    const daysSincePeriod = Math.floor(
      (date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePeriod < 0) {
      return null;
    }

    const cycleDay = (daysSincePeriod % cycleData.average_cycle_length) + 1;
    const ovulationDay = cycleData.average_cycle_length - 14;
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay + 1;

    const isInPeriod = cycleDay <= cycleData.average_period_length;
    const isOvulation = cycleDay === ovulationDay;
    const isFertileWindow = cycleDay >= fertileStart && cycleDay <= fertileEnd;

    let phase: CyclePhase;
    if (isInPeriod) {
      phase = 'menstrual';
    } else if (cycleDay <= fertileStart) {
      phase = 'follicular';
    } else if (isFertileWindow) {
      phase = isOvulation ? 'ovulation' : 'follicular';
    } else {
      phase = 'luteal';
    }

    const daysUntilNext = cycleData.average_cycle_length - cycleDay + 1;

    return {
      phase,
      cycleDay,
      daysUntilNext,
      isInPeriod,
      isOvulation,
      isFertileWindow,
    };
  };

  const getCycleInsights = (phase: CyclePhase): CycleInsights => {
    const insights: Record<CyclePhase, CycleInsights> = {
      menstrual: {
        energy_level: 'low',
        calorie_adjustment: 0,
        workout_recommendations: ['yoga', 'walking', 'stretching', 'light_cardio'],
        nutrition_tips: ['iron_rich_foods', 'hydration', 'magnesium', 'comfort_foods_ok'],
        phase_description: 'Energy is lower. Focus on gentle movement and nourishing foods.',
      },
      follicular: {
        energy_level: 'high',
        calorie_adjustment: 0,
        workout_recommendations: ['hiit', 'strength_training', 'cardio', 'new_challenges'],
        nutrition_tips: ['protein_support', 'complex_carbs', 'normal_intake'],
        phase_description: 'Peak energy phase! Great time for intense workouts and trying new challenges.',
      },
      ovulation: {
        energy_level: 'peak',
        calorie_adjustment: 0,
        workout_recommendations: ['pr_attempts', 'max_strength', 'hiit', 'competitions'],
        nutrition_tips: ['hydration', 'recovery_foods', 'antioxidants'],
        phase_description: 'Strongest performance window! Perfect time for personal records and competitions.',
      },
      luteal: {
        energy_level: 'moderate',
        calorie_adjustment: 200,
        workout_recommendations: ['steady_cardio', 'moderate_strength', 'flexibility', 'pilates'],
        nutrition_tips: ['higher_calories', 'healthy_cravings', 'complex_carbs', 'fiber'],
        phase_description: 'Higher metabolism (+100-300 cal/day). Expect increased hunger - this is normal!',
      },
    };

    return insights[phase];
  };

  // Helper: Get next predicted period date
  const getNextPeriodDate = (): Date | null => {
    if (!cycleData || !cycleData.is_enabled) return null;
    
    const lastPeriodStart = new Date(cycleData.last_period_start);
    const today = new Date();
    const daysSincePeriod = Math.floor(
      (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const currentCycleNumber = Math.floor(daysSincePeriod / cycleData.average_cycle_length);
    const nextPeriodStart = addDays(lastPeriodStart, (currentCycleNumber + 1) * cycleData.average_cycle_length);
    
    return nextPeriodStart;
  };

  // Helper: Log period start on a specific date
  const logPeriodStart = (date: Date) => {
    createOrUpdateMutation.mutate({
      is_enabled: true,
      last_period_start: format(date, 'yyyy-MM-dd'),
      average_cycle_length: cycleData?.average_cycle_length || 28,
      average_period_length: cycleData?.average_period_length || 5,
    });
  };

  // Listen for cycle:updated events from chatbot
  useEffect(() => {
    const handleCycleUpdate = () => {
      console.log('Cycle update event received, refreshing data...');
      queryClient.invalidateQueries({ queryKey: ['cycle-tracking', user?.id] });
    };

    window.addEventListener('cycle:updated', handleCycleUpdate);
    return () => window.removeEventListener('cycle:updated', handleCycleUpdate);
  }, [queryClient, user?.id]);

  return {
    cycleData,
    isLoading,
    isEnabled: cycleData?.is_enabled || false,
    createOrUpdate: createOrUpdateMutation.mutate,
    isUpdating: createOrUpdateMutation.isPending,
    calculatePhaseInfo,
    getCycleInsights,
    getNextPeriodDate,
    logPeriodStart,
  };
};