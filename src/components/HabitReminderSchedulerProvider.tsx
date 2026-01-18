import { useHabitReminders } from '@/hooks/useHabitReminders';

/**
 * Global provider that runs the habit reminder scheduler.
 * This component should be placed high in the component tree
 * so it runs regardless of which page the user is on.
 */
export const HabitReminderSchedulerProvider = () => {
  // Initialize the habit reminder system
  useHabitReminders();
  
  // This component doesn't render anything
  return null;
};
