import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alarmStorageService } from '@/services/alarmStorageService';
import { alarmNotificationService } from '@/services/alarmNotificationService';
import { useFitnessAlarm, type FitnessAlarm } from './useFitnessAlarm';

export const useAlarmScheduler = () => {
  const { alarms } = useFitnessAlarm();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const triggerAlarm = (alarm: FitnessAlarm) => {
    console.log('🚨 Alarm triggered:', alarm);
    
    // Store ringing alarm ID
    alarmStorageService.setRingingAlarm(alarm.id);
    
    // Show notification
    alarmNotificationService.showAlarmNotification(
      alarm.label || 'Fitness Alarm',
      alarm.push_up_count
    );
    
    // Vibrate device
    alarmNotificationService.vibrate();
    
    // Navigate to alarm ringing page
    navigate(`/alarm-ringing/${alarm.id}`);
  };

  const checkAlarms = () => {
    if (isChecking || !alarms) return;
    setIsChecking(true);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    console.log(`⏰ Checking alarms at ${now.toTimeString().slice(0, 8)} - Current day: ${currentDay}`);

    alarms.forEach((alarm: FitnessAlarm) => {
      if (!alarm.enabled) return;

      const alarmTime = alarm.alarm_time.slice(0, 5); // HH:MM
      const daysOfWeek = alarm.days_of_week as number[];

      // Check if current time matches alarm time (within 1 minute window)
      const isTimeMatch = alarmTime === currentTime;
      const isDayMatch = daysOfWeek.includes(currentDay);

      if (isTimeMatch && isDayMatch) {
        // Check if we haven't already triggered this alarm recently
        const state = alarmStorageService.getAlarmState();
        const lastCheck = state?.lastCheck ? new Date(state.lastCheck) : null;
        const minutesSinceLastCheck = lastCheck 
          ? Math.floor((now.getTime() - lastCheck.getTime()) / 60000)
          : 60;

        if (minutesSinceLastCheck >= 1) {
          triggerAlarm(alarm);
        }
      }
    });

    alarmStorageService.updateLastCheck();
    setIsChecking(false);
  };


  // Check alarms every minute
  useEffect(() => {
    // Initial check
    checkAlarms();

    // Set up interval
    const interval = setInterval(checkAlarms, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [alarms]);

  // Check on page visibility change (when app comes back to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAlarms();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [alarms]);

  return { checkAlarms, triggerAlarm };
};
