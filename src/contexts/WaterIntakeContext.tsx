import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { calculateEffectiveHydration, calculateBeverageNutrition, BEVERAGE_HYDRATION } from '@/lib/beverageHydration';
import { useTapCoins } from '@/hooks/useTapCoins';
import { getLocalDateString } from '@/utils/dateUtils';

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

interface WaterIntakeContextType {
  todaysIntake: number;
  totalLiquids: number;
  dehydrationFromAlcohol: number;
  todaysEntries: WaterEntry[];
  dailyGoal: number;
  progressPercent: number;
  loading: boolean;
  addWater: (amountOz: number) => Promise<boolean>;
  addBeverage: (amountOz: number, beverageType?: string) => Promise<boolean>;
  deleteEntry: (entryId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const WaterIntakeContext = createContext<WaterIntakeContextType | null>(null);

const ML_PER_OZ = 29.5735;

export const WaterIntakeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { awardCoins } = useTapCoins();
  const [todaysIntake, setTodaysIntake] = useState(0);
  const [totalLiquids, setTotalLiquids] = useState(0);
  const [dehydrationAmount, setDehydrationAmount] = useState(0);
  const [todaysEntries, setTodaysEntries] = useState<WaterEntry[]>([]);
  const [dailyGoalMl, setDailyGoalMl] = useState(1893);
  const [loading, setLoading] = useState(true);
  const [goalReachedToday, setGoalReachedToday] = useState(false);

  const today = getLocalDateString();

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

  // Listen for hydration updates from chatbot
  useEffect(() => {
    const handleHydrationUpdate = () => {
      console.log('Hydration update event received, refreshing data...');
      fetchTodaysIntake();
    };

    window.addEventListener('hydration:updated', handleHydrationUpdate);

    return () => {
      window.removeEventListener('hydration:updated', handleHydrationUpdate);
    };
  }, [fetchTodaysIntake]);

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

    const tempId = `temp-${Date.now()}`;
    const optimisticEntry: WaterEntry = {
      id: tempId,
      amount_ml: effectiveMl,
      total_amount_ml: totalMl,
      effective_hydration_ml: effectiveMl,
      beverage_type: beverageType,
      is_dehydrating: isDehydrating,
      logged_at: new Date().toISOString(),
      source: 'manual',
    };

    setTodaysEntries(prev => [optimisticEntry, ...prev]);
    setTodaysIntake(prev => prev + effectiveMl);
    setTotalLiquids(prev => prev + totalMl);
    if (isDehydrating) {
      setDehydrationAmount(prev => prev + Math.abs(effectiveMl));
    }

    try {
      const { data, error } = await supabase.from('water_intake')
        .insert({
          user_id: user.id,
          amount_ml: effectiveMl,
          total_amount_ml: totalMl,
          effective_hydration_ml: effectiveMl,
          beverage_type: beverageType,
          is_dehydrating: isDehydrating,
          logged_date: today,
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodaysEntries(prev => 
          prev.map(e => e.id === tempId ? { 
            ...data,
            beverage_type: beverageType,
            total_amount_ml: totalMl,
            effective_hydration_ml: effectiveMl,
            is_dehydrating: isDehydrating
          } : e)
        );
      }

      const nutrition = calculateBeverageNutrition(amountOz, beverageType);
      
      if (nutrition.calories > 0) {
        const { error: foodError } = await supabase.from('food_entries').insert({
          user_id: user.id,
          meal_type: 'snack',
          food_items: [{
            name: `${beverage.name} (${amountOz}oz)`,
            quantity: `${amountOz}oz`,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
          }],
          total_calories: nutrition.calories,
          total_protein: nutrition.protein,
          total_carbs: nutrition.carbs,
          total_fat: nutrition.fat,
          ai_analyzed: false,
          user_confirmed: true,
          logged_date: today,
          notes: `Beverage: ${beverageType}`,
        });
        
        if (foodError) {
          console.error('Error logging beverage calories:', foodError);
        }
      }

      const newEffectiveHydration = todaysIntake + effectiveMl;
      const goalReached = newEffectiveHydration >= dailyGoalMl && !goalReachedToday;
      
      if (goalReached) {
        setGoalReachedToday(true);
        
        const coinsAwarded = await awardCoins(
          3,
          'hydration_goal',
          '💧 Daily hydration goal reached!'
        );
        
        if (coinsAwarded) {
          toast.success('💧 Hydration goal reached! +3 Tap Coins', {
            duration: 5000,
          });
        }
        
        await checkHydrationStreak();
      }

      if (isDehydrating) {
        toast.warning(`⚠️ ${amountOz}oz ${beverage.name} logged (${Math.abs(effectiveOz).toFixed(1)}oz dehydration, +${nutrition.calories} cal)`);
      } else if (nutrition.calories > 0) {
        toast.success(`🥤 ${amountOz}oz ${beverage.name} added (+${nutrition.calories} cal)`);
      } else {
        toast.success(`💧 ${amountOz}oz ${beverage.name} added!`);
      }
      
      // Dispatch event for any other listeners
      window.dispatchEvent(new CustomEvent('hydration:updated'));
      
      return true;
    } catch (error) {
      setTodaysEntries(prev => prev.filter(e => e.id !== tempId));
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

  const checkHydrationStreak = async () => {
    if (!user) return;

    try {
      const { data: streakData } = await supabase
        .from('hydration_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as any;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      let currentStreak = 1;
      let longestStreak = 1;
      let milestoneCoinMap: Record<number, number> = {
        7: 30,
        14: 60,
        30: 150,
      };

      if (streakData) {
        const lastDate = streakData.last_hydration_date;
        
        if (lastDate === yesterdayStr) {
          currentStreak = streakData.current_streak + 1;
          longestStreak = Math.max(currentStreak, streakData.longest_streak);
        } else if (lastDate !== today) {
          currentStreak = 1;
          longestStreak = streakData.longest_streak;
        } else {
          return;
        }

        const milestones = [7, 14, 30];
        for (const milestone of milestones) {
          if (currentStreak === milestone) {
            const coins = milestoneCoinMap[milestone];
            const awarded = await awardCoins(
              coins,
              'hydration_streak',
              `${milestone}-day hydration streak!`
            );
            
            if (awarded) {
              toast.success(`🔥 ${milestone}-day hydration streak! +${coins} Tap Coins`, {
                duration: 6000,
              });
            }
          }
        }

        await supabase
          .from('hydration_streaks')
          .update({
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_hydration_date: today,
            total_hydration_days: streakData.total_hydration_days + 1,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('hydration_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_hydration_date: today,
            total_hydration_days: 1,
          } as any);
      }
    } catch (error) {
      console.error('Error checking hydration streak:', error);
    }
  };

  const addWater = async (amountOz: number) => {
    return addBeverage(amountOz, 'water');
  };

  const deleteEntry = async (entryId: string) => {
    const entry = todaysEntries.find(e => e.id === entryId);
    if (!entry) return;

    setTodaysEntries(prev => prev.filter(e => e.id !== entryId));
    const effectiveHydration = entry.effective_hydration_ml || entry.amount_ml;
    const totalAmount = entry.total_amount_ml || entry.amount_ml;
    setTodaysIntake(prev => prev - effectiveHydration);
    setTotalLiquids(prev => prev - totalAmount);
    if (entry.is_dehydrating) {
      setDehydrationAmount(prev => prev - Math.abs(effectiveHydration));
    }

    try {
      const { error } = await supabase
        .from('water_intake')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      if (entry.beverage_type && entry.beverage_type !== 'water') {
        const beverage = BEVERAGE_HYDRATION[entry.beverage_type];
        if (beverage && beverage.calories > 0) {
          await supabase
            .from('food_entries')
            .delete()
            .eq('user_id', user?.id)
            .eq('logged_date', today)
            .ilike('notes', `%Beverage: ${entry.beverage_type}%`);
        }
      }
      
      // Dispatch event for any other listeners
      window.dispatchEvent(new CustomEvent('hydration:updated'));
      
      toast.success('Entry removed');
    } catch (error) {
      setTodaysEntries(prev => [...prev, entry].sort((a, b) => 
        new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
      ));
      setTodaysIntake(prev => prev + effectiveHydration);
      setTotalLiquids(prev => prev + totalAmount);
      if (entry.is_dehydrating) {
        setDehydrationAmount(prev => prev + Math.abs(effectiveHydration));
      }
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const todaysIntakeOz = Math.round(todaysIntake / ML_PER_OZ);
  const totalLiquidsOz = Math.round(totalLiquids / ML_PER_OZ);
  const dehydrationOz = Math.round(dehydrationAmount / ML_PER_OZ);
  const dailyGoalOz = Math.round(dailyGoalMl / ML_PER_OZ);
  const progressPercent = Math.min(100, Math.round((todaysIntake / dailyGoalMl) * 100));

  return (
    <WaterIntakeContext.Provider value={{
      todaysIntake: todaysIntakeOz,
      totalLiquids: totalLiquidsOz,
      dehydrationFromAlcohol: dehydrationOz,
      todaysEntries,
      dailyGoal: dailyGoalOz,
      progressPercent,
      loading,
      addWater,
      addBeverage,
      deleteEntry,
      refetch: fetchTodaysIntake,
    }}>
      {children}
    </WaterIntakeContext.Provider>
  );
};

export const useWaterIntake = () => {
  const context = useContext(WaterIntakeContext);
  if (!context) {
    throw new Error('useWaterIntake must be used within a WaterIntakeProvider');
  }
  return context;
};
