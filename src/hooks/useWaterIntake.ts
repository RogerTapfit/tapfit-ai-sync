import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';

export interface WaterEntry {
  id: string;
  amount_ml: number;
  logged_at: string;
  source: string;
}

const ML_PER_OZ = 29.5735;

export const useWaterIntake = () => {
  const { user } = useAuth();
  const [todaysIntake, setTodaysIntake] = useState(0); // in ml
  const [todaysEntries, setTodaysEntries] = useState<WaterEntry[]>([]);
  const [dailyGoalMl, setDailyGoalMl] = useState(1893); // ~64 oz
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchTodaysIntake = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('water_intake')
        .select('id, amount_ml, logged_at, source')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      const entries = data || [];
      setTodaysEntries(entries);
      setTodaysIntake(entries.reduce((sum, e) => sum + e.amount_ml, 0));
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

  const addWater = async (amountOz: number) => {
    if (!user) {
      toast.error('Please sign in to track water');
      return false;
    }

    const amountMl = Math.round(amountOz * ML_PER_OZ);

    try {
      const { error } = await supabase.from('water_intake').insert({
        user_id: user.id,
        amount_ml: amountMl,
        logged_date: today,
        source: 'manual',
      });

      if (error) throw error;

      toast.success(`💧 ${amountOz}oz added!`);
      return true;
    } catch (error) {
      console.error('Error adding water:', error);
      toast.error('Failed to add water intake');
      return false;
    }
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
  const dailyGoalOz = Math.round(dailyGoalMl / ML_PER_OZ);
  const progressPercent = Math.min(100, Math.round((todaysIntake / dailyGoalMl) * 100));

  return {
    todaysIntake: todaysIntakeOz,
    todaysEntries,
    dailyGoal: dailyGoalOz,
    progressPercent,
    loading,
    addWater,
    deleteEntry,
    refetch: fetchTodaysIntake,
  };
};
