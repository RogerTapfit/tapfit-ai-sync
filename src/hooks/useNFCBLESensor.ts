import { useState, useEffect, useCallback } from 'react';
import { useBLESensor } from './useBLESensor';
import { nfcPuckIntegration, type NFCPuckConnection } from '@/services/nfcPuckIntegration';
import { useToast } from './use-toast';

export const useNFCBLESensor = () => {
  const bleSensor = useBLESensor();
  const [nfcConnection, setNfcConnection] = useState<NFCPuckConnection | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeNFC = async () => {
      try {
        await nfcPuckIntegration.initialize();
        setNfcSupported(true);
      } catch (error) {
        console.error('NFC initialization failed:', error);
        setNfcSupported(false);
      }
    };

    initializeNFC();

    // Subscribe to NFC connection changes
    const unsubscribe = nfcPuckIntegration.onConnectionChange((connection) => {
      setNfcConnection(connection);
      
      if (connection?.connectionStatus === 'connected') {
        toast({
          title: "NFC Connection Successful",
          description: `Connected to ${connection.machineId} via NFC`,
          variant: "default"
        });
        
        // Trigger BLE auto-connect when NFC connects
        bleSensor.autoConnect();
      }
    });

    return () => {
      unsubscribe();
      nfcPuckIntegration.stopNFCListening();
    };
  }, [toast]);

  const simulateNFCTap = useCallback((machineId: string) => {
    nfcPuckIntegration.simulateNFCTap(machineId as any);
  }, []);

  const writeNFCTag = useCallback(async (machineId: string) => {
    try {
      await nfcPuckIntegration.writeNFCTag(machineId as any);
      toast({
        title: "NFC Tag Written",
        description: `Tag programmed for ${machineId}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "NFC Write Failed",
        description: "Failed to write NFC tag",
        variant: "destructive"
      });
    }
  }, [toast]);

  const disconnectAll = useCallback(async () => {
    await Promise.all([
      bleSensor.disconnect(),
      nfcPuckIntegration.disconnectPuck()
    ]);
  }, [bleSensor]);

  return {
    // BLE sensor functionality
    ...bleSensor,
    
    // NFC functionality
    nfcConnection,
    nfcSupported,
    simulateNFCTap,
    writeNFCTag,
    
    // Combined functionality
    disconnectAll,
    
    // Enhanced connection status
    isNFCTriggeredConnection: nfcConnection?.connectionStatus === 'connected',
    connectionMethod: nfcConnection?.connectionStatus === 'connected' ? 'NFC' : 
                    bleSensor.isConnected ? 'Manual BLE' : 'None'
  };
};