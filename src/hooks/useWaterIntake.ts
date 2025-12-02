import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { calculateEffectiveHydration, BEVERAGE_HYDRATION } from '@/lib/beverageHydration';

export interface WaterEntry {
  id: string;
  amount_ml: number;
  logged_at: string;
  source: string;
  beverage_type?: string;
  total_amount_ml?: number;
  effective_hydration_ml?: number;
  is_dehydrating?: boolean;
}

const ML_PER_OZ = 29.5735;

export const useWaterIntake = () => {
  const { user } = useAuth();
  const [todaysIntake, setTodaysIntake] = useState(0); // effective hydration in ml
  const [totalLiquids, setTotalLiquids] = useState(0); // total liquids consumed in ml
  const [dehydrationAmount, setDehydrationAmount] = useState(0); // dehydration from alcohol in ml
  const [todaysEntries, setTodaysEntries] = useState<WaterEntry[]>([]);
  const [dailyGoalMl, setDailyGoalMl] = useState(1893); // ~64 oz
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchTodaysIntake = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('water_intake')
        .select('id, amount_ml, logged_at, source, beverage_type, total_amount_ml, effective_hydration_ml, is_dehydrating')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      const entries = data || [];
      setTodaysEntries(entries);
      
      // Calculate totals
      const effectiveHydration = entries.reduce((sum, e) => {
        return sum + (e.effective_hydration_ml || e.amount_ml);
      }, 0);
      
      const totalLiquidConsumed = entries.reduce((sum, e) => {
        return sum + (e.total_amount_ml || e.amount_ml);
      }, 0);
      
      const dehydration = entries
        .filter(e => e.is_dehydrating)
        .reduce((sum, e) => sum + Math.abs(e.effective_hydration_ml || 0), 0);
      
      setTodaysIntake(effectiveHydration);
      setTotalLiquids(totalLiquidConsumed);
      setDehydrationAmount(dehydration);
    } catch (error) {
      console.error('Error fetching water intake:', error);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchTodaysIntake();
  }, [fetchTodaysIntake]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('water-intake-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'water_intake',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTodaysIntake();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTodaysIntake]);

  const addBeverage = async (amountOz: number, beverageType: string = 'water') => {
    if (!user) {
      toast.error('Please sign in to track hydration');
      return false;
    }

    const beverage = BEVERAGE_HYDRATION[beverageType] || BEVERAGE_HYDRATION.water;
    const effectiveOz = calculateEffectiveHydration(amountOz, beverageType);
    const totalMl = Math.round(amountOz * ML_PER_OZ);
    const effectiveMl = Math.round(effectiveOz * ML_PER_OZ);
    const isDehydrating = beverage.hydrationFactor < 0;

    // Optimistic update - instant UI feedback
    setTodaysIntake(prev => prev + effectiveMl);
    setTotalLiquids(prev => prev + totalMl);
    if (isDehydrating) {
      setDehydrationAmount(prev => prev + Math.abs(effectiveMl));
    }

    try {
      const { error } = await supabase.from('water_intake').insert({
        user_id: user.id,
        amount_ml: effectiveMl, // Store effective for backwards compatibility
        total_amount_ml: totalMl,
        effective_hydration_ml: effectiveMl,
        beverage_type: beverageType,
        is_dehydrating: isDehydrating,
        logged_date: today,
        source: 'manual',
      });

      if (error) throw error;

      // Toast message based on beverage type
      if (isDehydrating) {
        toast.warning(`⚠️ ${amountOz}oz ${beverage.name} logged (${Math.abs(effectiveOz).toFixed(1)}oz dehydration)`);
      } else {
        const icon = beverageType === 'water' ? '💧' : '🥤';
        toast.success(`${icon} ${amountOz}oz ${beverage.name} added!`);
      }
      
      return true;
    } catch (error) {
      // Rollback on error
      setTodaysIntake(prev => prev - effectiveMl);
      setTotalLiquids(prev => prev - totalMl);
      if (isDehydrating) {
        setDehydrationAmount(prev => prev - Math.abs(effectiveMl));
      }
      console.error('Error adding beverage:', error);
      toast.error('Failed to add beverage');
      return false;
    }
  };

  // Legacy method for backwards compatibility
  const addWater = async (amountOz: number) => {
    return addBeverage(amountOz, 'water');
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('water_intake')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      toast.success('Entry removed');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  // Convert to oz for display
  const todaysIntakeOz = Math.round(todaysIntake / ML_PER_OZ);
  const totalLiquidsOz = Math.round(totalLiquids / ML_PER_OZ);
  const dehydrationOz = Math.round(dehydrationAmount / ML_PER_OZ);
  const dailyGoalOz = Math.round(dailyGoalMl / ML_PER_OZ);
  const progressPercent = Math.min(100, Math.round((todaysIntake / dailyGoalMl) * 100));

  return {
    todaysIntake: todaysIntakeOz, // Effective hydration
    totalLiquids: totalLiquidsOz,
    dehydrationFromAlcohol: dehydrationOz,
    todaysEntries,
    dailyGoal: dailyGoalOz,
    progressPercent,
    loading,
    addWater, // Legacy
    addBeverage,
    deleteEntry,
    refetch: fetchTodaysIntake,
  };
};
