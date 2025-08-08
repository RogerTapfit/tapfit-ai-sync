import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TapfitHealth } from '@/lib/tapfitHealth';

interface TapfitHealthDiagnosticsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TapfitHealthDiagnostics({ open, onOpenChange }: TapfitHealthDiagnosticsProps) {
  const [watchPaired, setWatchPaired] = useState<boolean | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  const statusColor = useMemo(() => ({
    good: 'bg-emerald-600',
    warn: 'bg-amber-600',
    bad: 'bg-red-600',
    info: 'bg-blue-600'
  }), []);

  const clearListener = useCallback(() => {
    try { listenerRef.current?.remove(); } catch {}
    listenerRef.current = null;
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      setError(null);
      const { watchPaired } = await TapfitHealth.isAvailable();
      setWatchPaired(watchPaired);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setWatchPaired(false);
    }
  }, []);

  const requestAuth = useCallback(async () => {
    try {
      setError(null);
      const res = await TapfitHealth.requestAuthorization();
      setAuthorized(!!res?.authorized);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setAuthorized(false);
    }
  }, []);

  const startLive = useCallback(async () => {
    try {
      setError(null);
      // Ensure availability and permissions
      const { watchPaired } = await TapfitHealth.isAvailable();
      if (!watchPaired) throw new Error('Watch not paired or TapFit watch app not installed');
      await TapfitHealth.requestAuthorization();
      await TapfitHealth.startWorkout({ activityType: 'functionalStrengthTraining' });
      setWorkoutActive(true);
      // Listen for HR updates
      clearListener();
      listenerRef.current = await TapfitHealth.addListener('heartRate', ({ bpm, timestamp }) => {
        setBpm(Math.round(bpm));
        setLastTs(timestamp);
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, [clearListener]);

  const stopLive = useCallback(async () => {
    try {
      setError(null);
      clearListener();
      await TapfitHealth.stopWorkout();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setWorkoutActive(false);
    }
  }, [clearListener]);

  useEffect(() => {
    if (!open) {
      // Cleanup when closing
      stopLive();
      setBpm(null);
      setLastTs(null);
      setError(null);
    } else {
      // Refresh quick status on open
      checkAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>TapFit Health Diagnostics</DialogTitle>
          <DialogDescription>Verify Apple Watch pairing and live heart rate.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={watchPaired ? statusColor.good : statusColor.bad}>
              {watchPaired === null ? 'Checking…' : watchPaired ? 'Watch Connected' : 'Watch Not Ready'}
            </Badge>
            <Badge className={authorized ? statusColor.good : statusColor.warn}>
              {authorized === null ? 'Auth Unknown' : authorized ? 'Health Authorized' : 'Needs Authorization'}
            </Badge>
            {workoutActive && <Badge className={statusColor.info}>Live Session</Badge>}
          </div>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm text-muted-foreground">Live Heart Rate</div>
              <div className="text-4xl font-bold tracking-tight">
                {bpm ?? '--'} <span className="text-base font-medium">bpm</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {lastTs ? new Date(lastTs).toLocaleTimeString() : 'No data yet'}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="text-xs text-red-600">{error}</div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={checkAvailability}>Check Availability</Button>
            <Button variant="secondary" onClick={requestAuth}>Request Authorization</Button>
            {!workoutActive ? (
              <Button onClick={startLive}>Start Live HR</Button>
            ) : (
              <Button variant="destructive" onClick={stopLive}>Stop</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
