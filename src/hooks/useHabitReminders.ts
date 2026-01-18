import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { habitNotificationService } from '@/services/habitNotificationService';
import { getLocalDateString } from '@/utils/dateUtils';

interface HabitWithReminders {
  id: string;
  name: string;
  icon: string;
  reminder_enabled: boolean;
  reminder_times: string[];
  reminder_days: number[];
}

const TRIGGERED_REMINDERS_KEY = 'habit_triggered_reminders';

export const useHabitReminders = () => {
  const { user } = useAuth();
  const lastCheckRef = useRef<string>('');

  interface TriggeredRemindersData {
    date: string;
    reminders: Record<string, string[]>;
  }

  // Get triggered reminders from localStorage
  const getTriggeredReminders = useCallback((): TriggeredRemindersData => {
    try {
      const stored = localStorage.getItem(TRIGGERED_REMINDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TriggeredRemindersData;
        const today = getLocalDateString(new Date());
        // Clean up old entries (only keep today's)
        if (parsed.date !== today) {
          return { date: today, reminders: {} };
        }
        return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return { date: getLocalDateString(new Date()), reminders: {} };
  }, []);

  // Save triggered reminder
  const markReminderTriggered = useCallback((habitId: string, time: string) => {
    const current = getTriggeredReminders();
    if (!current.reminders[habitId]) {
      current.reminders[habitId] = [];
    }
    if (!current.reminders[habitId].includes(time)) {
      current.reminders[habitId].push(time);
    }
    localStorage.setItem(TRIGGERED_REMINDERS_KEY, JSON.stringify(current));
  }, [getTriggeredReminders]);

  // Check if reminder was already triggered
  const wasReminderTriggered = useCallback((habitId: string, time: string): boolean => {
    const current = getTriggeredReminders();
    return current.reminders[habitId]?.includes(time) || false;
  }, [getTriggeredReminders]);

  // Check if habit is already completed today
  const isHabitCompletedToday = useCallback(async (habitId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    const today = getLocalDateString(new Date());
    const { data } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .eq('completed_date', today)
      .maybeSingle();
    
    return !!data;
  }, [user?.id]);

  // Check for reminders that should trigger now
  const checkReminders = useCallback(async () => {
    if (!user?.id) {
      console.log('⏸️ Habit reminder check skipped: no user');
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Prevent checking the same minute multiple times
    const checkKey = `${currentTime}-${currentDay}`;
    if (lastCheckRef.current === checkKey) return;
    lastCheckRef.current = checkKey;

    console.log(`🔍 Checking habit reminders at ${currentTime} (day ${currentDay})`);

    // Check notification permission
    if (!habitNotificationService.hasPermission()) {
      console.log('⚠️ Notification permission not granted');
    }

    try {
      // Fetch habits with reminders enabled
      const { data: habits, error } = await supabase
        .from('user_habits')
        .select('id, name, icon, reminder_enabled, reminder_times, reminder_days')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('reminder_enabled', true);

      if (error) {
        console.error('❌ Error fetching habits:', error);
        return;
      }

      if (!habits || habits.length === 0) {
        console.log('📭 No habits with reminders enabled');
        return;
      }

      console.log(`📋 Found ${habits.length} habit(s) with reminders enabled`);

      for (const habit of habits as HabitWithReminders[]) {
        // Parse reminder settings
        const reminderTimes = Array.isArray(habit.reminder_times) 
          ? habit.reminder_times 
          : [];
        const reminderDays = Array.isArray(habit.reminder_days) 
          ? habit.reminder_days 
          : [0, 1, 2, 3, 4, 5, 6];

        // Check if today is a reminder day
        if (!reminderDays.includes(currentDay)) {
          console.log(`  ⏭️ ${habit.name}: Not scheduled for today (day ${currentDay})`);
          continue;
        }

        console.log(`  📌 ${habit.name}: Scheduled times: ${reminderTimes.join(', ')}`);

        // Check if current time matches any reminder time
        for (const reminderTime of reminderTimes) {
          if (reminderTime === currentTime) {
            console.log(`  ⏰ ${habit.name}: Time matches ${currentTime}!`);
            
            // Check if already triggered
            if (wasReminderTriggered(habit.id, currentTime)) {
              console.log(`  ✓ ${habit.name}: Already triggered this minute`);
              continue;
            }

            // Check if habit is already completed
            const completed = await isHabitCompletedToday(habit.id);
            if (completed) {
              console.log(`  ✓ ${habit.name}: Already completed today`);
              continue;
            }

            // Trigger the reminder
            console.log(`🔔 TRIGGERING REMINDER: ${habit.name} at ${currentTime}`);
            
            // Show notification
            habitNotificationService.showHabitReminder(habit.name, habit.icon);
            habitNotificationService.playReminderSound();
            habitNotificationService.vibrate();

            // Mark as triggered
            markReminderTriggered(habit.id, currentTime);
          }
        }
      }
    } catch (error) {
      console.error('Error checking habit reminders:', error);
    }
  }, [user?.id, wasReminderTriggered, isHabitCompletedToday, markReminderTriggered]);

  // Set up interval to check reminders every minute
  useEffect(() => {
    if (!user?.id) return;

    // Check immediately
    checkReminders();

    // Check every 30 seconds (to catch minute changes)
    const interval = setInterval(checkReminders, 30000);

    // Also check when app becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, checkReminders]);

  return { checkReminders };
};
