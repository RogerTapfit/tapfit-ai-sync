import { useEffect, useState, useCallback } from 'react';
import { TapfitHealth } from '@/lib/tapfitHealth';

export function useHeartRate() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const subPromise = TapfitHealth.addListener('heartRate', ({ bpm }) => setBpm(Math.round(bpm)));
    return () => { subPromise.then((s) => s.remove()); };
  }, []);

  useEffect(() => {
    // Pre-check availability to show pairing status early
    TapfitHealth.isAvailable()
      .then(({ watchPaired }) => setConnected(!!watchPaired))
      .catch(() => setConnected(false));
  }, []);

  const start = useCallback(async (activityType: string = 'functionalStrengthTraining') => {
    setLoading(true); setError(null);
    try {
      const { watchPaired } = await TapfitHealth.isAvailable();
      setConnected(watchPaired);
      if (!watchPaired) throw new Error('Apple Watch not paired or watch app not installed.');
      await TapfitHealth.requestAuthorization();
      await TapfitHealth.startWorkout({ activityType });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    try { await TapfitHealth.stopWorkout(); } catch {}
  }, []);

  return { bpm, loading, error, connected, start, stop };
}
