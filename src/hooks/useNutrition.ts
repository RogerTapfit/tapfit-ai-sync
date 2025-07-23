import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NutritionGoal {
  id: string;
  goal_type: 'fat_loss' | 'muscle_gain' | 'maintenance';
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  is_active: boolean;
}

export interface MetabolismReading {
  id: string;
  reading_type: 'fat_burn' | 'carb_burn' | 'mixed';
  reading_value?: number;
  device_source: string;
  recommendations: string[];
  created_at: string;
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
}

export interface FoodEntry {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  photo_url?: string;
  ai_analyzed: boolean;
  user_confirmed: boolean;
  notes?: string;
  logged_date: string;
  created_at: string;
}

export interface DailyNutritionSummary {
  id: string;
  summary_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meals_count: number;
  metabolism_readings_count: number;
}

export const useNutrition = () => {
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoal | null>(null);
  const [metabolismReadings, setMetabolismReadings] = useState<MetabolismReading[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user nutrition data
  useEffect(() => {
    loadNutritionGoals();
    loadTodaysSummary();
    loadRecentMetabolismReadings();
    loadTodaysFoodEntries();
  }, []);

  const loadNutritionGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading nutrition goals:', error);
        return;
      }

      setNutritionGoals(data as NutritionGoal);
    } catch (error) {
      console.error('Error loading nutrition goals:', error);
    }
  };

  const loadTodaysSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('summary_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily summary:', error);
        return;
      }

      setDailySummary(data);
    } catch (error) {
      console.error('Error loading daily summary:', error);
    }
  };

  const loadRecentMetabolismReadings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('metabolism_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading metabolism readings:', error);
        return;
      }

      setMetabolismReadings(data as MetabolismReading[] || []);
    } catch (error) {
      console.error('Error loading metabolism readings:', error);
    }
  };

  const loadTodaysFoodEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading food entries:', error);
        return;
      }

      setFoodEntries((data as any[])?.map(item => ({
        ...item,
        food_items: Array.isArray(item.food_items) ? item.food_items : []
      })) || []);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  const saveNutritionGoals = async (goals: Omit<NutritionGoal, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Deactivate existing goals
      await supabase
        .from('nutrition_goals')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Create new goal
      const { data, error } = await supabase
        .from('nutrition_goals')
        .insert({
          user_id: user.id,
          ...goals
        })
        .select()
        .single();

      if (error) throw error;

      setNutritionGoals(data as NutritionGoal);
      toast.success('Nutrition goals saved!');
    } catch (error) {
      console.error('Error saving nutrition goals:', error);
      toast.error('Failed to save nutrition goals');
    }
  };

  const addMetabolismReading = async (reading: Omit<MetabolismReading, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('metabolism_readings')
        .insert({
          user_id: user.id,
          ...reading
        })
        .select()
        .single();

      if (error) throw error;

      setMetabolismReadings(prev => [data as MetabolismReading, ...prev.slice(0, 9)]);
      toast.success('Metabolism reading added!');
    } catch (error) {
      console.error('Error adding metabolism reading:', error);
      toast.error('Failed to add metabolism reading');
    }
  };

  const analyzeFoodImage = async (imageBase64: string, mealType: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyzeFood', {
        body: { imageBase64, mealType }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error analyzing food image:', error);
      toast.error('Failed to analyze food image');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveFoodEntry = async (entry: Omit<FoodEntry, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          ...entry,
          food_items: entry.food_items as any
        })
        .select()
        .single();

      if (error) throw error;

      setFoodEntries(prev => [{
        ...data as any,
        food_items: Array.isArray((data as any).food_items) ? (data as any).food_items : []
      }, ...prev]);
      toast.success('Food entry saved!');
      
      // Refresh daily summary
      await loadTodaysSummary();
      
      return data;
    } catch (error) {
      console.error('Error saving food entry:', error);
      toast.error('Failed to save food entry');
      throw error;
    }
  };

  const updateFoodEntry = async (id: string, updates: Partial<FoodEntry>) => {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFoodEntries(prev => 
        prev.map(entry => entry.id === id ? { ...entry, ...data } : entry)
      );
      
      toast.success('Food entry updated!');
      await loadTodaysSummary();
    } catch (error) {
      console.error('Error updating food entry:', error);
      toast.error('Failed to update food entry');
    }
  };

  const deleteFoodEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFoodEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Food entry deleted!');
      await loadTodaysSummary();
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast.error('Failed to delete food entry');
    }
  };

  const getWeeklyFoodEntries = async (startDate: string, endDate: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate)
        .order('logged_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading weekly food entries:', error);
      return [];
    }
  };

  return {
    nutritionGoals,
    metabolismReadings,
    foodEntries,
    dailySummary,
    loading,
    saveNutritionGoals,
    addMetabolismReading,
    analyzeFoodImage,
    saveFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    getWeeklyFoodEntries,
    refreshData: () => {
      loadNutritionGoals();
      loadTodaysSummary();
      loadRecentMetabolismReadings();
      loadTodaysFoodEntries();
    }
  };
};