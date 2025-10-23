import { useState, useEffect, useCallback } from 'react';
import { swimTrackerService } from '@/services/swimTrackerService';
import { SwimSettings, SwimMetrics, SwimTrackerStatus } from '@/types/swim';
import { useAuth } from '@/components/AuthGuard';

export function useSwimTracker() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SwimMetrics>(swimTrackerService.getMetrics());
  const [status, setStatus] = useState<SwimTrackerStatus>(swimTrackerService.getStatus());

  useEffect(() => {
    const unsubscribe = swimTrackerService.subscribe((newMetrics, newStatus) => {
      setMetrics(newMetrics);
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const initialize = useCallback(async (settings: SwimSettings) => {
    if (!user?.id) throw new Error('User not authenticated');
    await swimTrackerService.initialize(user.id, settings);
  }, [user?.id]);

  const start = useCallback(() => {
    swimTrackerService.start();
  }, []);

  const pause = useCallback(() => {
    swimTrackerService.pause();
  }, []);

  const resume = useCallback(() => {
    swimTrackerService.resume();
  }, []);

  const completeLap = useCallback(() => {
    swimTrackerService.completeLap();
  }, []);

  const updateHeartRate = useCallback((bpm: number) => {
    swimTrackerService.updateHeartRate(bpm);
  }, []);

  const complete = useCallback(async () => {
    return await swimTrackerService.complete();
  }, []);

  const abandon = useCallback(() => {
    swimTrackerService.abandon();
  }, []);

  return {
    metrics,
    status,
    initialize,
    start,
    pause,
    resume,
    completeLap,
    updateHeartRate,
    complete,
    abandon,
  };
}
