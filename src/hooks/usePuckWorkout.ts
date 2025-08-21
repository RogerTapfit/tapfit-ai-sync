import { useState, useCallback, useEffect, useRef } from 'react';
import { PuckClient, type PuckStatus, type PuckState } from '@/ble/puckClient';
import { audioManager } from '@/utils/audioUtils';

export type WorkoutState = 'idle' | 'connecting' | 'connected' | 'calibrating' | 'awaiting_start' | 'in_set' | 'rest' | 'done';

interface UsePuckWorkoutReturn {
  state: WorkoutState;
  isReconnecting: boolean;
  repCount: number;
  setNumber: number;
  restTimeRemaining: number;
  targetReps: number;
  targetSets: number;
  puckState: PuckState | null;
  batteryLevel: number;
  handshake: () => Promise<void>;
  startWorkout: () => Promise<void>;
  endWorkout: () => Promise<void>;
  calibrate: () => Promise<void>;
}

export function usePuckWorkout(autoStart = false): UsePuckWorkoutReturn {
  const [state, setState] = useState<WorkoutState>('idle');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [puckState, setPuckState] = useState<PuckState | null>(null);
  
  const targetReps = 10;
  const targetSets = 4;
  const restDuration = 90; // seconds
  
  const clientRef = useRef<PuckClient | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audio = audioManager;

  // Handle Puck status changes
  const handleStatus = useCallback((status: PuckStatus) => {
    console.log('Puck status changed:', status);
    
    switch (status) {
      case 'handshaking':
        setState('connecting');
        setIsReconnecting(false);
        break;
      case 'connected':
        setState('connected');
        setIsReconnecting(false);
        break;
      case 'calibrating':
        setState('calibrating');
        break;
      case 'session_active':
        setState('awaiting_start');
        break;
      case 'disconnected':
        if (state !== 'idle') {
          setIsReconnecting(true);
          // Auto-reconnect after a delay
          setTimeout(() => {
            if (clientRef.current) {
              reconnect();
            }
          }, 2000);
        }
        break;
      case 'error':
        setState('idle');
        setIsReconnecting(false);
        break;
    }
  }, [state]);

  // Handle rep count updates
  const handleRep = useCallback((newRepCount: number) => {
    console.log('Rep received:', newRepCount);
    setRepCount(newRepCount);
    
    // Only process if we're in a set
    if (state === 'in_set') {
      // Check if set is complete
      if (newRepCount >= targetReps) {
        audio.playSetComplete();
        
        if (setNumber >= targetSets) {
          // Workout complete
          audio.playWorkoutComplete();
          setState('done');
        } else {
          // Start rest period
          startRest();
        }
      }
    }
  }, [state, setNumber, targetReps, targetSets, audio]);

  // Handle Puck state updates
  const handleStateUpdate = useCallback((newPuckState: PuckState) => {
    setPuckState(newPuckState);
  }, []);

  // Reconnection logic
  const reconnect = useCallback(async () => {
    if (!clientRef.current || isReconnecting) return;
    
    try {
      setIsReconnecting(true);
      await clientRef.current.handshake(false);
    } catch (error) {
      console.error('Reconnect failed:', error);
      setTimeout(reconnect, 5000); // Try again in 5 seconds
    }
  }, [isReconnecting]);

  // Start rest period between sets
  const startRest = useCallback(() => {
    setState('rest');
    setRestTimeRemaining(restDuration);
    
    // Reset rep count for next set
    if (clientRef.current) {
      clientRef.current.reset();
    }
    
    // Start countdown timer
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    
    restIntervalRef.current = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          // Rest complete
          clearInterval(restIntervalRef.current!);
          restIntervalRef.current = null;
          audio.playRestComplete();
          
          // Move to next set
          setSetNumber(prevSet => prevSet + 1);
          setRepCount(0);
          setState('in_set');
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [restDuration, audio]);

  // Initialize connection
  const handshake = useCallback(async () => {
    if (clientRef.current || state === 'connecting') return;
    
    try {
      clientRef.current = new PuckClient(handleStatus, handleRep, handleStateUpdate);
      await clientRef.current.handshake(false);
    } catch (error) {
      console.error('Handshake failed:', error);
      setState('idle');
      clientRef.current = null;
    }
  }, [handleStatus, handleRep, handleStateUpdate, state]);

  // Start workout session
  const startWorkout = useCallback(async () => {
    if (!clientRef.current) {
      await handshake();
      return;
    }
    
    try {
      // Reset workout state
      setRepCount(0);
      setSetNumber(1);
      setRestTimeRemaining(0);
      
      // Start session on device
      await clientRef.current.startSession();
      setState('in_set');
    } catch (error) {
      console.error('Start workout failed:', error);
    }
  }, [handshake]);

  // End workout session
  const endWorkout = useCallback(async () => {
    // Clear any running intervals
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    
    // End session on device and disconnect
    if (clientRef.current) {
      try {
        await clientRef.current.endSession();
        await clientRef.current.disconnect();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
      clientRef.current = null;
    }
    
    // Reset state
    setState('idle');
    setIsReconnecting(false);
    setRepCount(0);
    setSetNumber(1);
    setRestTimeRemaining(0);
    setPuckState(null);
  }, []);

  // Calibrate device
  const calibrate = useCallback(async () => {
    if (!clientRef.current) return;
    
    try {
      await clientRef.current.calibrate();
    } catch (error) {
      console.error('Calibration failed:', error);
    }
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && state === 'idle') {
      handshake().then(() => {
        // Wait a bit then start workout
        setTimeout(startWorkout, 1000);
      }).catch(console.error);
    }
  }, [autoStart, state, handshake, startWorkout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
      if (clientRef.current) {
        clientRef.current.disconnect().catch(console.error);
      }
    };
  }, []);

  return {
    state,
    isReconnecting,
    repCount,
    setNumber,
    restTimeRemaining,
    targetReps,
    targetSets,
    puckState,
    batteryLevel: puckState?.batteryLevel ?? 1.0,
    handshake,
    startWorkout,
    endWorkout,
    calibrate,
  };
}