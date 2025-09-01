import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PuckClient, type PuckStatus, type PuckState } from '@/ble/puckClient';
import { nfcPuckIntegration, type NFCPuckConnection } from '@/services/nfcPuckIntegration';
import { nfcService, type MachineId } from '@/services/nfcService';
import { toast } from 'sonner';

export interface EnhancedNFCBLEState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: PuckStatus;
  deviceName?: string;
  deviceId?: string;
  
  // NFC state
  nfcSupported: boolean;
  nfcConnection: NFCPuckConnection | null;
  isNFCTriggeredConnection: boolean;
  
  // Puck state
  puckState: PuckState | null;
  repCount: number;
  batteryLevel: number;
  
  // Session state
  isSessionActive: boolean;
  sessionStartTime?: Date;
  lastActivityTime?: Date;
  
  // Error handling
  lastError?: string;
  connectionAttempts: number;
}

export interface EnhancedNFCBLEActions {
  // Connection management
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<boolean>;
  
  // NFC functionality
  simulateNFCTap: (machineId: MachineId) => void;
  writeNFCTag: (machineId: MachineId) => Promise<void>;
  
  // Puck control
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  calibrate: () => Promise<void>;
  reset: () => Promise<void>;
  
  // Testing
  testConnection: () => Promise<boolean>;
}

export const useEnhancedNFCBLE = (): EnhancedNFCBLEState & EnhancedNFCBLEActions => {
  const puckClientRef = useRef<PuckClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptsRef = useRef(0);
  
  // State management
  const [state, setState] = useState<EnhancedNFCBLEState>({
    isConnected: false,
    isConnecting: false,
    connectionStatus: 'disconnected',
    nfcSupported: false,
    nfcConnection: null,
    isNFCTriggeredConnection: false,
    puckState: null,
    repCount: 0,
    batteryLevel: 100,
    isSessionActive: false,
    connectionAttempts: 0
  });

  // Initialize NFC integration
  useEffect(() => {
    const initializeNFC = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('Running in web mode - NFC simulation available');
        setState(prev => ({ ...prev, nfcSupported: true }));
        return;
      }

      try {
        await nfcPuckIntegration.initialize();
        setState(prev => ({ ...prev, nfcSupported: true }));
        
        // Subscribe to NFC connection changes
        const unsubscribe = nfcPuckIntegration.onConnectionChange((connection) => {
          setState(prev => ({
            ...prev,
            nfcConnection: connection,
            isNFCTriggeredConnection: connection?.connectionStatus === 'connected'
          }));
          
          // Handle NFC-triggered connections
          if (connection?.connectionStatus === 'connected' && connection.puckClient) {
            puckClientRef.current = connection.puckClient;
            updateConnectionState('connected', connection.puckClient);
            toast.success(`NFC connection established to ${connection.machineId}!`);
          }
        });

        return () => {
          unsubscribe();
          nfcPuckIntegration.stopNFCListening();
        };
      } catch (error) {
        console.error('NFC initialization failed:', error);
        setState(prev => ({ 
          ...prev, 
          nfcSupported: false,
          lastError: 'NFC not available on this device'
        }));
      }
    };

    initializeNFC();
  }, []);

  // Update connection state helper
  const updateConnectionState = useCallback((status: PuckStatus, client?: PuckClient) => {
    setState(prev => ({
      ...prev,
      connectionStatus: status,
      isConnected: status === 'connected' || status === 'session_active',
      isConnecting: status === 'handshaking',
      deviceName: client ? 'TapFit-Puck' : prev.deviceName,
      deviceId: client ? 'puck-device' : prev.deviceId,
      connectionAttempts: status === 'connected' ? 0 : prev.connectionAttempts
    }));
  }, []);

  // Puck status callback
  const handlePuckStatus = useCallback((status: PuckStatus) => {
    updateConnectionState(status, puckClientRef.current || undefined);
    
    // Handle session status changes
    if (status === 'session_active') {
      setState(prev => ({
        ...prev,
        isSessionActive: true,
        sessionStartTime: new Date()
      }));
    } else if (status === 'connected' && state.isSessionActive) {
      setState(prev => ({
        ...prev,
        isSessionActive: false
      }));
    }
  }, [updateConnectionState, state.isSessionActive]);

  // Rep count callback
  const handleRepCount = useCallback((rep: number) => {
    setState(prev => ({
      ...prev,
      repCount: rep,
      lastActivityTime: new Date()
    }));
  }, []);

  // Puck state update callback
  const handlePuckStateUpdate = useCallback((puckState: PuckState) => {
    setState(prev => ({
      ...prev,
      puckState,
      batteryLevel: puckState.batteryLevel * 100,
      lastActivityTime: puckState.lastHeartbeat > 0 ? new Date(puckState.lastHeartbeat) : prev.lastActivityTime
    }));
  }, []);

  // Manual connection
  const connect = useCallback(async (): Promise<boolean> => {
    if (state.isConnected || state.isConnecting) {
      return state.isConnected;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true,
      connectionAttempts: prev.connectionAttempts + 1
    }));
    connectionAttemptsRef.current++;

    try {
      const client = await PuckClient.autoConnect(
        handlePuckStatus,
        handleRepCount,
        handlePuckStateUpdate
      );

      if (client) {
        puckClientRef.current = client;
        updateConnectionState('connected', client);
        toast.success('Successfully connected to TapFit Puck!');
        return true;
      } else {
        throw new Error('Failed to establish connection');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      
      setState(prev => ({
        ...prev,
        lastError: errorMessage,
        isConnecting: false
      }));
      
      toast.error(`Connection failed: ${errorMessage}`);
      
      // Auto-retry with exponential backoff
      if (connectionAttemptsRef.current < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current - 1), 5000);
        toast.info(`Retrying connection in ${retryDelay / 1000}s...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, retryDelay);
      }
      
      return false;
    }
  }, [state.isConnected, state.isConnecting, handlePuckStatus, handleRepCount, handlePuckStateUpdate, updateConnectionState, toast]);

  // Disconnect
  const disconnect = useCallback(async (): Promise<void> => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      if (puckClientRef.current) {
        await puckClientRef.current.disconnect();
        puckClientRef.current = null;
      }
      
      await nfcPuckIntegration.disconnectPuck();
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionStatus: 'disconnected',
        deviceName: undefined,
        deviceId: undefined,
        isSessionActive: false,
        sessionStartTime: undefined,
        repCount: 0,
        connectionAttempts: 0
      }));
      
      connectionAttemptsRef.current = 0;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Error during disconnection');
    }
  }, [toast]);

  // Reconnect
  const reconnect = useCallback(async (): Promise<boolean> => {
    await disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    return await connect();
  }, [disconnect, connect]);

  // NFC simulation
  const simulateNFCTap = useCallback((machineId: MachineId) => {
    nfcPuckIntegration.simulateNFCTap(machineId);
    toast.info(`Simulated NFC tap for ${machineId}`);
  }, [toast]);

  // Write NFC tag
  const writeNFCTag = useCallback(async (machineId: MachineId): Promise<void> => {
    try {
      await nfcPuckIntegration.writeNFCTag(machineId);
    } catch (error) {
      console.error('NFC write failed:', error);
      throw error;
    }
  }, []);

  // Puck control functions
  const startSession = useCallback(async (): Promise<void> => {
    if (!puckClientRef.current) {
      throw new Error('No Puck device connected');
    }
    
    try {
      await puckClientRef.current.startSession();
      setState(prev => ({
        ...prev,
        isSessionActive: true,
        sessionStartTime: new Date()
      }));
      toast.success('Workout session started!');
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start workout session');
      throw error;
    }
  }, [toast]);

  const endSession = useCallback(async (): Promise<void> => {
    if (!puckClientRef.current) return;
    
    try {
      await puckClientRef.current.endSession();
      setState(prev => ({
        ...prev,
        isSessionActive: false,
        sessionStartTime: undefined
      }));
      toast.success('Workout session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end workout session');
      throw error;
    }
  }, [toast]);

  const calibrate = useCallback(async (): Promise<void> => {
    if (!puckClientRef.current) {
      throw new Error('No Puck device connected');
    }
    
    try {
      await puckClientRef.current.calibrate();
      toast.success('Calibration started - keep device still for 3 seconds');
    } catch (error) {
      console.error('Calibration failed:', error);
      toast.error('Failed to start calibration');
      throw error;
    }
  }, [toast]);

  const reset = useCallback(async (): Promise<void> => {
    if (!puckClientRef.current) return;
    
    try {
      await puckClientRef.current.reset();
      setState(prev => ({
        ...prev,
        repCount: 0,
        isSessionActive: false,
        sessionStartTime: undefined
      }));
      toast.success('Device reset');
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Failed to reset device');
      throw error;
    }
  }, [toast]);

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!puckClientRef.current) return false;
    
    try {
      await puckClientRef.current.requestStatus();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    simulateNFCTap,
    writeNFCTag,
    startSession,
    endSession,
    calibrate,
    reset,
    testConnection
  };
};