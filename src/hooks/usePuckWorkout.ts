import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { blePuckUtil } from '@/services/blePuckUtil';
import { audioManager } from '@/utils/audioUtils';

export type WorkoutState =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'awaitStart' }
  | { kind: 'inSet'; setIndex: 1|2|3|4; reps: number }
  | { kind: 'rest'; setIndex: 1|2|3|4; seconds: number }
  | { kind: 'done' };

const SERVICE = '0000FFE0-0000-1000-8000-00805F9B34FB';
const CHAR = '0000FFE1-0000-1000-8000-00805F9B34FB';
const MAX_REPS = 10;
const MAX_SETS = 4;
const REST_SEC = 90;

export function usePuckWorkout(autoStart = false) {
  const [state, setState] = useState<WorkoutState>({ kind: 'idle' });
  const [device, setDevice] = useState<{ deviceId: string; name?: string } | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const unsubscribeRef = useRef<null | (() => Promise<void>)>(null);
  const restIntervalRef = useRef<any>(null);
  const lastRepRef = useRef<number>(0);
  const audio = audioManager;

  const cleanup = useCallback(async () => {
    if (unsubscribeRef.current) {
      await unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (!device) return;
    setIsReconnecting(true);
    try {
      const re = await blePuckUtil.connectFirst({ service: SERVICE, onDisconnect: () => handleDisconnect() });
      setDevice(re);
      // Re-subscribe
      if (unsubscribeRef.current) await unsubscribeRef.current();
      unsubscribeRef.current = await blePuckUtil.subscribe(re.deviceId, SERVICE, CHAR, onNotify);
      setIsReconnecting(false);
    } catch (e) {
      // keep trying in a few seconds
      setTimeout(handleDisconnect, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  const onNotify = useCallback((data: ArrayBuffer) => {
    const u = new Uint8Array(data);
    if (u[0] !== 0x01) return;
    const reps = u[1] ?? 0;

    setState(prev => {
      if (prev.kind !== 'inSet') return prev;
      // Debounce duplicates or decreases
      if (reps === lastRepRef.current) return prev;
      lastRepRef.current = reps;

      const nextReps = Math.min(Math.max(reps, 0), MAX_REPS);
      if (nextReps >= MAX_REPS) {
        audio.playSetComplete();
        // Lock to 10 and start rest
        startRest(prev.setIndex);
        return { ...prev, reps: MAX_REPS };
      }
      return { ...prev, reps: nextReps };
    });
  }, [audio]);

  const startRest = useCallback((setIndex: 1|2|3|4) => {
    setState({ kind: 'rest', setIndex, seconds: REST_SEC });
    // Reset puck counter for next set
    if (device?.deviceId) {
      blePuckUtil.writeSafe(device.deviceId, SERVICE, CHAR, Uint8Array.from([0x00]));
    }

    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restIntervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.kind !== 'rest') return prev;
        if (prev.seconds <= 1) {
          clearInterval(restIntervalRef.current);
          restIntervalRef.current = null;
          audio.playRestComplete();
          if (prev.setIndex < MAX_SETS) {
            lastRepRef.current = 0;
            // Enter next set
            setState({ kind: 'inSet', setIndex: ((prev.setIndex + 1) as 1|2|3|4), reps: 0 });
            // Ensure device counter is cleared
            if (device?.deviceId) {
              blePuckUtil.writeSafe(device.deviceId, SERVICE, CHAR, Uint8Array.from([0x00]));
            }
          } else {
            // Done
            audio.playWorkoutComplete();
            setState({ kind: 'done' });
          }
          return prev; // this return won't be used as state is set above
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
  }, [audio, device?.deviceId]);

  const handshake = useCallback(async () => {
    setState({ kind: 'connecting' });
    try {
      const conn = await blePuckUtil.connectFirst({ service: SERVICE, onDisconnect: () => handleDisconnect() });
      setDevice(conn);
      unsubscribeRef.current = await blePuckUtil.subscribe(conn.deviceId, SERVICE, CHAR, onNotify);
      // Reset reps on connect
      await blePuckUtil.writeSafe(conn.deviceId, SERVICE, CHAR, Uint8Array.from([0x00]));
      lastRepRef.current = 0;
      setState({ kind: 'awaitStart' });
    } catch (e) {
      console.error('Failed to handshake', e);
      setState({ kind: 'idle' });
    }
  }, [handleDisconnect, onNotify]);

  const startWorkout = useCallback(async () => {
    if (!device?.deviceId) {
      await handshake();
    }
    try {
      if (device?.deviceId) {
        await blePuckUtil.writeSafe(device.deviceId, SERVICE, CHAR, Uint8Array.from([0x00]));
      }
      lastRepRef.current = 0;
      setState({ kind: 'inSet', setIndex: 1, reps: 0 });
    } catch (e) {
      console.error('Failed to start workout', e);
      setState({ kind: 'idle' });
    }
  }, [device?.deviceId, handshake]);

  const endWorkout = useCallback(async () => {
    await cleanup();
    if (device?.deviceId) await blePuckUtil.disconnect(device.deviceId);
    setDevice(null);
    setState({ kind: 'idle' });
  }, [cleanup, device?.deviceId]);

  useEffect(() => {
    if (autoStart && state.kind === 'idle') {
      // Backwards-compat: autoStart triggers full flow
      handshake().then(() => startWorkout()).catch(() => setState({ kind: 'idle' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return {
    state,
    isReconnecting,
    handshake,
    startWorkout,
    endWorkout,
  } as const;
}
