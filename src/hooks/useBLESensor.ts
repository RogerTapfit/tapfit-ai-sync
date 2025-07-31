import { useState, useEffect, useCallback } from 'react';
import { bleService, SensorData, BLEConnectionStatus } from '@/services/bleService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface LiveWorkoutSession {
  id: string;
  startTime: Date;
  totalReps: number;
  activeTime: number; // in seconds
  lastActivityTime: Date;
  sensorData: SensorData[];
}

export const useBLESensor = () => {
  const [connectionStatus, setConnectionStatus] = useState<BLEConnectionStatus>({
    isConnected: false,
    isScanning: false
  });
  
  const [currentSession, setCurrentSession] = useState<LiveWorkoutSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [realtimeReps, setRealtimeReps] = useState(0);
  const [lastMotionTime, setLastMotionTime] = useState<Date | null>(null);
  
  const { toast } = useToast();

  // Initialize BLE service
  useEffect(() => {
    const initializeBLE = async () => {
      try {
        await bleService.initialize();
        console.log('BLE service initialized');
      } catch (error) {
        console.error('Failed to initialize BLE:', error);
        toast({
          title: "BLE Error",
          description: "Failed to initialize Bluetooth. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    initializeBLE();
  }, [toast]);

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = bleService.onStatusChange((status) => {
      setConnectionStatus(status);
      
      if (status.isConnected && status.deviceName) {
        toast({
          title: "Device Connected",
          description: `Connected to ${status.deviceName}`,
          variant: "default"
        });
      } else if (!status.isConnected && !status.isScanning) {
        toast({
          title: "Device Disconnected",
          description: "Puck.js sensor disconnected",
          variant: "destructive"
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  // Subscribe to sensor data
  useEffect(() => {
    const unsubscribe = bleService.onSensorData((data) => {
      console.log('Received sensor data:', data);
      
      if (data.type === 'rep') {
        setRealtimeReps(prev => prev + 1);
        setLastMotionTime(new Date());
        
        // Auto-start session on first rep
        if (!isSessionActive) {
          startWorkoutSession();
        }
        
        // Add to current session
        setCurrentSession(prev => {
          if (!prev) return null;
          
          const updatedSession = {
            ...prev,
            totalReps: prev.totalReps + 1,
            lastActivityTime: new Date(),
            sensorData: [...prev.sensorData, data]
          };
          
          // Save to database
          saveSensorDataToDB(data, prev.id);
          
          return updatedSession;
        });
      } else if (data.type === 'motion') {
        setLastMotionTime(new Date());
        
        // Update session activity time
        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            lastActivityTime: new Date(),
            sensorData: [...prev.sensorData, data]
          };
        });
      }
    });

    return unsubscribe;
  }, [isSessionActive]);

  // Calculate active time
  useEffect(() => {
    if (!isSessionActive || !currentSession) return;

    const interval = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null;
        
        const now = new Date();
        const timeSinceStart = Math.floor((now.getTime() - prev.startTime.getTime()) / 1000);
        
        return {
          ...prev,
          activeTime: timeSinceStart
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive, currentSession]);

  const requestPermissions = useCallback(async () => {
    try {
      const granted = await bleService.requestPermissions();
      if (!granted) {
        toast({
          title: "Permissions Required",
          description: "Bluetooth permissions are required to connect to sensors.",
          variant: "destructive"
        });
      }
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, [toast]);

  const startScanning = useCallback(async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      await bleService.startScanning();
      toast({
        title: "Scanning for Devices",
        description: "Looking for Puck.js sensors nearby...",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to start scanning:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to start scanning for devices.",
        variant: "destructive"
      });
    }
  }, [requestPermissions, toast]);

  const stopScanning = useCallback(async () => {
    try {
      await bleService.stopScanning();
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await bleService.disconnect();
      // End current session if active
      if (isSessionActive) {
        await endWorkoutSession();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [isSessionActive]);

  const autoConnect = useCallback(async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      await bleService.startScanning();
      toast({
        title: "Auto-connecting to Puck.js",
        description: "Searching for nearby sensors...",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to auto-connect:', error);
      toast({
        title: "Auto-connect Failed",
        description: "Failed to automatically connect to Puck.js.",
        variant: "destructive"
      });
    }
  }, [requestPermissions, toast]);

  const startWorkoutSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to start a workout session.",
          variant: "destructive"
        });
        return;
      }

      // Create session in database
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          notes: 'BLE Sensor Workout'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create workout session:', error);
        toast({
          title: "Session Error",
          description: "Failed to start workout session.",
          variant: "destructive"
        });
        return;
      }

      const newSession: LiveWorkoutSession = {
        id: session.id,
        startTime: new Date(),
        totalReps: 0,
        activeTime: 0,
        lastActivityTime: new Date(),
        sensorData: []
      };

      setCurrentSession(newSession);
      setIsSessionActive(true);
      setRealtimeReps(0);

      toast({
        title: "Workout Started",
        description: "Live workout session is now active!",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to start workout session:', error);
    }
  }, [toast]);

  const endWorkoutSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      // Update session end time in database
      const { error } = await supabase
        .from('workout_sessions')
        .update({
          end_time: new Date().toISOString(),
          notes: `Completed ${currentSession.totalReps} reps in ${Math.floor(currentSession.activeTime / 60)} minutes`
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error('Failed to update workout session:', error);
      }

      setIsSessionActive(false);
      setCurrentSession(null);

      toast({
        title: "Workout Complete",
        description: `Session ended: ${currentSession.totalReps} reps completed!`,
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to end workout session:', error);
    }
  }, [currentSession, toast]);

  const saveSensorDataToDB = useCallback(async (data: SensorData, sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to smart_pin_data table
      const { error } = await supabase
        .from('smart_pin_data')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          machine_id: 'ble_sensor', // Generic for BLE sensors
          reps: data.type === 'rep' ? 1 : 0,
          sets: data.type === 'rep' ? 1 : 0,
          weight: 0, // BLE sensors don't track weight
          duration: 0, // Individual data point
          muscle_group: 'unknown', // Would need to be set by user
          heart_rate: data.type === 'heartRate' ? data.value : null,
          timestamp: data.timestamp.toISOString()
        });

      if (error) {
        console.error('Failed to save sensor data:', error);
      }
    } catch (error) {
      console.error('Error saving sensor data:', error);
    }
  }, []);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    isScanning: connectionStatus.isScanning,
    
    // Session state
    currentSession,
    isSessionActive,
    realtimeReps,
    lastMotionTime,
    
    // Actions
    startScanning,
    stopScanning,
    disconnect,
    startWorkoutSession,
    endWorkoutSession,
    requestPermissions,
    autoConnect
  };
};