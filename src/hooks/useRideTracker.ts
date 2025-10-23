import { useState, useEffect, useCallback } from 'react';
import { rideTrackerService } from '@/services/rideTrackerService';
import { RideMetrics, RideSettings, RideTrackerStatus } from '@/types/ride';
import { supabase } from '@/integrations/supabase/client';

export function useRideTracker() {
  const [metrics, setMetrics] = useState<RideMetrics | null>(null);
  const [status, setStatus] = useState<RideTrackerStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = rideTrackerService.subscribe((newMetrics, newStatus) => {
      setMetrics(newMetrics);
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const startRide = useCallback(async (settings: RideSettings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const id = await rideTrackerService.startTracking(settings, user.id);
    setSessionId(id);
  }, []);

  const pauseRide = useCallback(async () => {
    await rideTrackerService.pauseTracking();
  }, []);

  const resumeRide = useCallback(async () => {
    await rideTrackerService.resumeTracking();
  }, []);

  const stopRide = useCallback(async () => {
    const session = await rideTrackerService.stopTracking();
    setSessionId(null);
    return session;
  }, []);

  return {
    metrics,
    status,
    sessionId,
    startRide,
    pauseRide,
    resumeRide,
    stopRide,
  };
}
