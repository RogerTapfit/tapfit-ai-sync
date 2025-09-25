import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';

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
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('cycle_tracking')
        .select('*')
        .eq('user_id', user.id)
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
      if (!user?.id) throw new Error('User not authenticated');

      const payload = {
        user_id: user.id,
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
    onError: (error) => {
      console.error('Error updating cycle tracking:', error);
      toast.error('Failed to update cycle tracking settings');
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

  return {
    cycleData,
    isLoading,
    isEnabled: cycleData?.is_enabled || false,
    createOrUpdate: createOrUpdateMutation.mutate,
    isUpdating: createOrUpdateMutation.isPending,
    calculatePhaseInfo,
    getCycleInsights,
  };
};