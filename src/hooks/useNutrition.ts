import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentLocalDate } from '@/utils/dateUtils';

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
  photo_storage_path?: string;
  thumbnail_url?: string;
  photo_urls?: string[];
  photo_storage_paths?: string[];
  thumbnail_urls?: string[];
  ai_analyzed: boolean;
  user_confirmed: boolean;
  notes?: string;
  logged_date: string;
  created_at: string;
  health_grade?: string;
  grade_score?: number;
  analysis_confidence?: number;
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

export interface AlcoholEntry {
  id: string;
  drink_type: string;
  alcohol_content: number;
  quantity: number;
  logged_date: string;
  logged_time?: string;
  notes?: string;
  created_at: string;
}

// Type transformation functions
const transformDatabaseToNutritionGoal = (data: any): NutritionGoal => ({
  id: data.id,
  goal_type: data.goal_type as 'fat_loss' | 'muscle_gain' | 'maintenance',
  daily_calories: data.daily_calories,
  protein_grams: data.protein_grams,
  carbs_grams: data.carbs_grams,
  fat_grams: data.fat_grams,
  is_active: data.is_active
});

const transformDatabaseToMetabolismReading = (data: any): MetabolismReading => ({
  id: data.id,
  reading_type: data.reading_type as 'fat_burn' | 'carb_burn' | 'mixed',
  reading_value: data.reading_value,
  device_source: data.device_source,
  recommendations: data.recommendations || [],
  created_at: data.created_at
});

const transformDatabaseToFoodEntry = (data: any): FoodEntry => ({
  id: data.id,
  meal_type: data.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
  food_items: Array.isArray(data.food_items) ? data.food_items as FoodItem[] : [],
  total_calories: data.total_calories,
  total_protein: data.total_protein,
  total_carbs: data.total_carbs,
  total_fat: data.total_fat,
  photo_url: data.photo_url,
  photo_storage_path: data.photo_storage_path,
  thumbnail_url: data.thumbnail_url,
  photo_urls: data.photo_urls || [],
  photo_storage_paths: data.photo_storage_paths || [],
  thumbnail_urls: data.thumbnail_urls || [],
  ai_analyzed: data.ai_analyzed,
  user_confirmed: data.user_confirmed,
  notes: data.notes,
  logged_date: data.logged_date,
  created_at: data.created_at,
  health_grade: data.health_grade,
  grade_score: data.grade_score
});

const transformDatabaseToDailySummary = (data: any): DailyNutritionSummary => ({
  id: data.id,
  summary_date: data.summary_date,
  total_calories: data.total_calories,
  total_protein: data.total_protein,
  total_carbs: data.total_carbs,
  total_fat: data.total_fat,
  meals_count: data.meals_count,
  metabolism_readings_count: data.metabolism_readings_count
});

const transformDatabaseToAlcoholEntry = (data: any): AlcoholEntry => ({
  id: data.id,
  drink_type: data.drink_type,
  alcohol_content: data.alcohol_content || 0,
  quantity: data.quantity || 1,
  logged_date: data.logged_date,
  logged_time: data.logged_time,
  notes: data.notes,
  created_at: data.created_at
});

export const useNutrition = () => {
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoal | null>(null);
  const [metabolismReadings, setMetabolismReadings] = useState<MetabolismReading[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [alcoholEntries, setAlcoholEntries] = useState<AlcoholEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Define refreshData early to use in effects
  const refreshData = () => {
    loadNutritionGoals();
    loadTodaysSummary();
    loadRecentMetabolismReadings();
    loadTodaysFoodEntries();
    loadTodaysAlcoholEntries();
  };

  // Load user nutrition data on mount and user change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Defer data fetching to prevent deadlocks
        setTimeout(() => {
          loadNutritionGoals();
          loadTodaysSummary();
          loadRecentMetabolismReadings();
          loadTodaysFoodEntries();
          loadTodaysAlcoholEntries();
        }, 0);
      }
    });

    // Load initial data
    loadNutritionGoals();
    loadTodaysSummary();
    loadRecentMetabolismReadings();
    loadTodaysFoodEntries();
    loadTodaysAlcoholEntries();

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription for food entries
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('food-entries-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'food_entries',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time food entries change:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newEntry = transformDatabaseToFoodEntry(payload.new);
              setFoodEntries(prev => {
                // Check if entry already exists to prevent duplicates
                const exists = prev.some(entry => entry.id === newEntry.id);
                if (exists) return prev;
                return [newEntry, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedEntry = transformDatabaseToFoodEntry(payload.new);
              setFoodEntries(prev => 
                prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
              );
            } else if (payload.eventType === 'DELETE') {
              setFoodEntries(prev => prev.filter(entry => entry.id !== payload.old.id));
            }
            
            // Refresh daily summary on any change
            loadTodaysSummary();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscriptions();
  }, []);

  // Real-time subscription for daily nutrition summary
  useEffect(() => {
    const setupSummarySubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('nutrition-summary-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_nutrition_summary',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time nutrition summary change:', payload);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const summary = transformDatabaseToDailySummary(payload.new);
              // Only update if it's today's summary
              const today = getCurrentLocalDate();
              if (summary.summary_date === today) {
                setDailySummary(summary);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSummarySubscription();
  }, []);

  // Refresh data when app regains focus (for mobile sync)
  useEffect(() => {
    const handleFocus = () => {
      refreshData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

      setNutritionGoals(data ? transformDatabaseToNutritionGoal(data) : null);
    } catch (error) {
      console.error('Error loading nutrition goals:', error);
    }
  };

  const loadTodaysSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getCurrentLocalDate();
      
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

      setDailySummary(data ? transformDatabaseToDailySummary(data) : null);
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

      setMetabolismReadings((data || []).map(transformDatabaseToMetabolismReading));
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

      setFoodEntries((data || []).map(transformDatabaseToFoodEntry));
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

      setNutritionGoals(transformDatabaseToNutritionGoal(data));
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

      setMetabolismReadings(prev => [transformDatabaseToMetabolismReading(data), ...prev.slice(0, 9)]);
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

      console.log('Saving food entry with photo data:', {
        photo_url: entry.photo_url,
        photo_storage_path: entry.photo_storage_path,
        thumbnail_url: entry.thumbnail_url
      });

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

      console.log('Food entry saved successfully with photo data:', data);

      setFoodEntries(prev => [transformDatabaseToFoodEntry(data), ...prev]);
      
      // Refresh daily summary
      await loadTodaysSummary();
      
      return data;
    } catch (error) {
      console.error('Error saving food entry:', error);
      throw error;
    }
  };

  const updateFoodEntry = async (id: string, updates: Partial<FoodEntry>) => {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .update({
          ...updates,
          food_items: updates.food_items ? updates.food_items as any : undefined
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFoodEntries(prev => 
        prev.map(entry => entry.id === id ? transformDatabaseToFoodEntry(data) : entry)
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

  const loadTodaysAlcoholEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('alcohol_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading alcohol entries:', error);
        return;
      }

      setAlcoholEntries((data || []).map(transformDatabaseToAlcoholEntry));
    } catch (error) {
      console.error('Error loading alcohol entries:', error);
    }
  };

  const saveAlcoholEntry = async (entry: Omit<AlcoholEntry, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('alcohol_entries')
        .insert({
          user_id: user.id,
          ...entry
        })
        .select()
        .single();

      if (error) throw error;

      setAlcoholEntries(prev => [transformDatabaseToAlcoholEntry(data), ...prev]);
      toast.success('Alcohol entry saved!');
      
      return data;
    } catch (error) {
      console.error('Error saving alcohol entry:', error);
      toast.error('Failed to save alcohol entry');
      throw error;
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

      return (data || []).map(transformDatabaseToFoodEntry);
    } catch (error) {
      console.error('Error loading weekly food entries:', error);
      return [];
    }
  };

  return {
    nutritionGoals,
    metabolismReadings,
    foodEntries,
    alcoholEntries,
    dailySummary,
    loading,
    saveNutritionGoals,
    addMetabolismReading,
    analyzeFoodImage,
    saveFoodEntry,
    saveAlcoholEntry,
    updateFoodEntry,
    deleteFoodEntry,
    getWeeklyFoodEntries,
    refreshData
  };
};