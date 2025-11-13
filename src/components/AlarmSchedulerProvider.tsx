import { useAlarmScheduler } from '@/hooks/useAlarmScheduler';

/**
 * Component that initializes the global alarm scheduler
 * Must be placed inside QueryClientProvider and Router
 */
export const AlarmSchedulerProvider = () => {
  useAlarmScheduler();
  return null;
};
