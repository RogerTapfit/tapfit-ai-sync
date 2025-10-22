import { useState, useEffect, useCallback } from 'react';
import { runTrackerService } from '@/services/runTrackerService';
import { RunMetrics, RunSettings, RunTrackerStatus } from '@/types/run';
import { supabase } from '@/integrations/supabase/client';

export function useRunTracker() {
  const [metrics, setMetrics] = useState<RunMetrics | null>(null);
  const [status, setStatus] = useState<RunTrackerStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = runTrackerService.subscribe((newMetrics, newStatus) => {
      setMetrics(newMetrics);
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const startRun = useCallback(async (settings: RunSettings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const id = await runTrackerService.startTracking(settings, user.id);
    setSessionId(id);
  }, []);

  const pauseRun = useCallback(async () => {
    await runTrackerService.pauseTracking();
  }, []);

  const resumeRun = useCallback(async () => {
    await runTrackerService.resumeTracking();
  }, []);

  const stopRun = useCallback(async () => {
    const session = await runTrackerService.stopTracking();
    setSessionId(null);
    return session;
  }, []);

  return {
    metrics,
    status,
    sessionId,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
  };
}
