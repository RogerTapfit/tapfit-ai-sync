import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export interface MealPlan {
  id: string;
  user_id: string;
  planned_date: string;
  meal_type: string;
  recipe_id: string | null;
  custom_meal_name: string | null;
  food_items: any[];
  planned_calories: number;
  planned_protein: number;
  planned_carbs: number;
  planned_fat: number;
  status: string;
  notes: string | null;
  created_at: string;
  // Joined recipe data
  recipe?: {
    name: string;
    image_url: string | null;
    cuisine: string;
  };
}

export function useMealPlans(selectedDate?: Date) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, MealPlan[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDate) {
      loadWeeklyPlans(selectedDate);
    }
  }, [selectedDate]);

  const loadMealPlansForDate = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const dateStr = format(date, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          recipe:saved_recipes(name, image_url, cuisine)
        `)
        .eq('user_id', user.id)
        .eq('planned_date', dateStr)
        .order('meal_type');

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        food_items: item.food_items as any[],
        recipe: item.recipe as MealPlan['recipe'],
      })) as MealPlan[];
    } catch (error) {
      console.error('Error loading meal plans:', error);
      return [];
    }
  };

  const loadWeeklyPlans = async (date: Date) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          recipe:saved_recipes(name, image_url, cuisine)
        `)
        .eq('user_id', user.id)
        .gte('planned_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('planned_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('planned_date')
        .order('meal_type');

      if (error) throw error;

      // Group by date
      const grouped: Record<string, MealPlan[]> = {};
      for (let i = 0; i < 7; i++) {
        const dayDate = format(addDays(weekStart, i), 'yyyy-MM-dd');
        grouped[dayDate] = [];
      }

      (data || []).forEach((item) => {
        const plan: MealPlan = {
          ...item,
          food_items: item.food_items as any[],
          recipe: item.recipe as MealPlan['recipe'],
        };
        if (grouped[item.planned_date]) {
          grouped[item.planned_date].push(plan);
        }
      });

      setWeeklyPlans(grouped);
      
      // Set current day's plans
      const todayStr = format(date, 'yyyy-MM-dd');
      setMealPlans(grouped[todayStr] || []);
    } catch (error) {
      console.error('Error loading weekly plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMealPlan = async (plan: {
    planned_date: string;
    meal_type: string;
    recipe_id?: string;
    custom_meal_name?: string;
    planned_calories?: number;
    planned_protein?: number;
    planned_carbs?: number;
    planned_fat?: number;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to plan meals');
        return null;
      }

      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          planned_date: plan.planned_date,
          meal_type: plan.meal_type,
          recipe_id: plan.recipe_id || null,
          custom_meal_name: plan.custom_meal_name || null,
          planned_calories: plan.planned_calories || 0,
          planned_protein: plan.planned_protein || 0,
          planned_carbs: plan.planned_carbs || 0,
          planned_fat: plan.planned_fat || 0,
          notes: plan.notes || null,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Meal added to plan!');
      if (selectedDate) {
        await loadWeeklyPlans(selectedDate);
      }
      return data;
    } catch (error) {
      console.error('Error adding meal plan:', error);
      toast.error('Failed to add meal to plan');
      return null;
    }
  };

  const updateMealPlan = async (planId: string, updates: Partial<MealPlan>) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;

      if (selectedDate) {
        await loadWeeklyPlans(selectedDate);
      }
    } catch (error) {
      console.error('Error updating meal plan:', error);
      toast.error('Failed to update meal plan');
    }
  };

  const deleteMealPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Meal removed from plan');
      if (selectedDate) {
        await loadWeeklyPlans(selectedDate);
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      toast.error('Failed to remove meal');
    }
  };

  const markAsCompleted = async (planId: string) => {
    await updateMealPlan(planId, { status: 'completed' });
    toast.success('Meal marked as completed!');
  };

  const copyDayPlan = async (fromDate: string, toDate: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const plansForDay = weeklyPlans[fromDate] || [];
      
      for (const plan of plansForDay) {
        await supabase.from('meal_plans').insert({
          user_id: user.id,
          planned_date: toDate,
          meal_type: plan.meal_type,
          recipe_id: plan.recipe_id,
          custom_meal_name: plan.custom_meal_name,
          planned_calories: plan.planned_calories,
          planned_protein: plan.planned_protein,
          planned_carbs: plan.planned_carbs,
          planned_fat: plan.planned_fat,
          notes: plan.notes,
          status: 'planned',
        });
      }

      toast.success('Day plan copied!');
      if (selectedDate) {
        await loadWeeklyPlans(selectedDate);
      }
    } catch (error) {
      console.error('Error copying day plan:', error);
      toast.error('Failed to copy plan');
    }
  };

  return {
    mealPlans,
    weeklyPlans,
    loading,
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    markAsCompleted,
    copyDayPlan,
    refreshPlans: () => selectedDate && loadWeeklyPlans(selectedDate),
  };
}
