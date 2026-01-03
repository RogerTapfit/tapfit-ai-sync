import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { getLocalDateString } from '@/utils/dateUtils';
import { toast } from 'sonner';

export interface UserHabit {
  id: string;
  name: string;
  icon: string;
  category: string;
  goalPerDay: number;
  isActive: boolean;
  sortOrder: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedDate: string;
  completedAt: string;
  coinsAwarded: number;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

// Pre-built habit templates
export const HABIT_TEMPLATES = [
  // Wellness
  { name: 'Morning Stretches', icon: '🧘', category: 'wellness' },
  { name: 'Evening Stretches', icon: '🌙', category: 'wellness' },
  { name: 'Meditation', icon: '🧘‍♂️', category: 'wellness' },
  { name: 'Morning Routine', icon: '☀️', category: 'wellness' },
  { name: 'Night Routine', icon: '🌛', category: 'wellness' },
  
  // Hygiene
  { name: 'Brush Teeth (AM)', icon: '🦷', category: 'hygiene' },
  { name: 'Brush Teeth (PM)', icon: '🦷', category: 'hygiene' },
  { name: 'Floss', icon: '🧵', category: 'hygiene' },
  { name: 'Shower', icon: '🚿', category: 'hygiene' },
  { name: 'Skincare', icon: '✨', category: 'hygiene' },
  
  // Content/Productivity
  { name: 'Posted to TikTok', icon: '📱', category: 'content' },
  { name: 'Made Content Today', icon: '🎬', category: 'content' },
  { name: 'Posted to Instagram', icon: '📸', category: 'content' },
  { name: 'Journaling', icon: '📔', category: 'content' },
  { name: 'Read for 30min', icon: '📚', category: 'content' },
  
  // Fitness
  { name: 'Did Cardio', icon: '🏃', category: 'fitness' },
  { name: 'Took Vitamins', icon: '💊', category: 'fitness' },
  { name: 'No Junk Food', icon: '🥗', category: 'fitness' },
  { name: 'Walked 10k Steps', icon: '👟', category: 'fitness' },
  { name: 'Sleep Early', icon: '😴', category: 'fitness' },
];

export const useHabitTracking = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [todaysCompletions, setTodaysCompletions] = useState<HabitCompletion[]>([]);
  const [streaks, setStreaks] = useState<Map<string, HabitStreak>>(new Map());
  const [loading, setLoading] = useState(true);

  const today = getLocalDateString(new Date());

  // Fetch user's habits
  const fetchHabits = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setHabits((data || []).map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        category: h.category,
        goalPerDay: h.goal_per_day,
        isActive: h.is_active,
        sortOrder: h.sort_order
      })));
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  }, [user?.id]);

  // Fetch today's completions
  const fetchTodaysCompletions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_date', today);

      if (error) throw error;

      setTodaysCompletions((data || []).map(c => ({
        id: c.id,
        habitId: c.habit_id,
        completedDate: c.completed_date,
        completedAt: c.completed_at,
        coinsAwarded: c.coins_awarded
      })));
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  }, [user?.id, today]);

  // Fetch streaks
  const fetchStreaks = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const streakMap = new Map<string, HabitStreak>();
      (data || []).forEach(s => {
        streakMap.set(s.habit_id, {
          habitId: s.habit_id,
          currentStreak: s.current_streak,
          longestStreak: s.longest_streak,
          lastCompletedDate: s.last_completed_date
        });
      });
      setStreaks(streakMap);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  }, [user?.id]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHabits(), fetchTodaysCompletions(), fetchStreaks()]);
      setLoading(false);
    };
    loadData();
  }, [fetchHabits, fetchTodaysCompletions, fetchStreaks]);

  // Check if habit is completed today
  const isHabitCompletedToday = (habitId: string): boolean => {
    return todaysCompletions.some(c => c.habitId === habitId);
  };

  // Toggle habit completion
  const toggleHabitCompletion = async (habitId: string): Promise<boolean> => {
    if (!user?.id) return false;

    const isCompleted = isHabitCompletedToday(habitId);

    try {
      if (isCompleted) {
        // Remove completion
        const completion = todaysCompletions.find(c => c.habitId === habitId);
        if (completion) {
          const { error } = await supabase
            .from('habit_completions')
            .delete()
            .eq('id', completion.id);

          if (error) throw error;

          setTodaysCompletions(prev => prev.filter(c => c.id !== completion.id));
          
          // Update streak (decrement if this was last completed date)
          const streak = streaks.get(habitId);
          if (streak && streak.lastCompletedDate === today) {
            await supabase
              .from('habit_streaks')
              .update({
                current_streak: Math.max(0, streak.currentStreak - 1),
                last_completed_date: null // Would need to recalculate properly
              })
              .eq('user_id', user.id)
              .eq('habit_id', habitId);
          }
        }
        return false;
      } else {
        // Add completion
        const coinsToAward = 5; // Base coins per habit

        const { data, error } = await supabase
          .from('habit_completions')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            completed_date: today,
            coins_awarded: coinsToAward
          })
          .select()
          .single();

        if (error) throw error;

        setTodaysCompletions(prev => [...prev, {
          id: data.id,
          habitId: data.habit_id,
          completedDate: data.completed_date,
          completedAt: data.completed_at,
          coinsAwarded: data.coins_awarded
        }]);

        // Update streak
        const streak = streaks.get(habitId);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        let newStreak = 1;
        if (streak && streak.lastCompletedDate === yesterdayStr) {
          newStreak = streak.currentStreak + 1;
        }

        await supabase
          .from('habit_streaks')
          .upsert({
            user_id: user.id,
            habit_id: habitId,
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak?.longestStreak || 0),
            last_completed_date: today
          }, {
            onConflict: 'user_id,habit_id'
          });

        // Award coins
        await supabase.rpc('add_tap_coins', {
          _user_id: user.id,
          _amount: coinsToAward,
          _transaction_type: 'habit_completion',
          _description: `Completed habit: ${habits.find(h => h.id === habitId)?.name || 'Habit'}`
        });

        // Check if all habits completed for bonus
        const allCompleted = habits.every(h => 
          h.id === habitId || todaysCompletions.some(c => c.habitId === h.id)
        );

        if (allCompleted && habits.length > 1) {
          const bonusCoins = 10;
          await supabase.rpc('add_tap_coins', {
            _user_id: user.id,
            _amount: bonusCoins,
            _transaction_type: 'habit_bonus',
            _description: 'All daily habits completed bonus!'
          });
          toast.success('🎉 All habits done! +10 bonus coins!');
        }

        // Refresh streaks
        fetchStreaks();
        return true;
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast.error('Failed to update habit');
      return false;
    }
  };

  // Add a new habit
  const addHabit = async (name: string, icon: string, category: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('user_habits')
        .insert({
          user_id: user.id,
          name,
          icon,
          category,
          sort_order: habits.length
        })
        .select()
        .single();

      if (error) throw error;

      setHabits(prev => [...prev, {
        id: data.id,
        name: data.name,
        icon: data.icon,
        category: data.category,
        goalPerDay: data.goal_per_day,
        isActive: data.is_active,
        sortOrder: data.sort_order
      }]);

      toast.success(`Added "${name}" to your habits!`);
      return true;
    } catch (error) {
      console.error('Error adding habit:', error);
      toast.error('Failed to add habit');
      return false;
    }
  };

  // Delete a habit
  const deleteHabit = async (habitId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_habits')
        .update({ is_active: false })
        .eq('id', habitId);

      if (error) throw error;

      setHabits(prev => prev.filter(h => h.id !== habitId));
      toast.success('Habit removed');
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Failed to remove habit');
      return false;
    }
  };

  // Get today's progress
  const getTodaysProgress = () => {
    const completed = todaysCompletions.length;
    const total = habits.length;
    return { completed, total };
  };

  // Get streak for a habit
  const getHabitStreak = (habitId: string): number => {
    return streaks.get(habitId)?.currentStreak || 0;
  };

  return {
    habits,
    todaysCompletions,
    loading,
    isHabitCompletedToday,
    toggleHabitCompletion,
    addHabit,
    deleteHabit,
    getTodaysProgress,
    getHabitStreak,
    refreshData: () => {
      fetchHabits();
      fetchTodaysCompletions();
      fetchStreaks();
    }
  };
};
