import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { nfcPuckIntegration, type NFCPuckConnection } from '../services/nfcPuckIntegration';
import { Bluetooth, Zap, Activity, Wifi, WifiOff, Battery, Nfc } from 'lucide-react';

interface NFCPuckTestPanelProps {
  onPuckConnected?: (puckClient: any) => void;
}

export default function NFCPuckTestPanel({ onPuckConnected }: NFCPuckTestPanelProps) {
  const [connection, setConnection] = useState<NFCPuckConnection | null>(null);
  const [testStatus, setTestStatus] = useState<string>('Ready for NFC Auto-Connect testing');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeIntegration = async () => {
      try {
        await nfcPuckIntegration.initialize();
        setIsInitialized(true);
        setTestStatus('NFC-Puck integration ready');
      } catch (error) {
        console.error('Failed to initialize NFC-Puck integration:', error);
        setTestStatus('NFC not available - using manual mode');
        setIsInitialized(true);
      }
    };

    initializeIntegration();

    const unsubscribe = nfcPuckIntegration.onConnectionChange((newConnection) => {
      setConnection(newConnection);
      if (newConnection?.puckClient) {
        onPuckConnected?.(newConnection.puckClient);
      }
    });

    return () => {
      unsubscribe();
      nfcPuckIntegration.stopNFCListening();
    };
  }, [onPuckConnected]);

  const simulateNFCTap = async () => {
    setTestStatus('Simulating NFC tap for chest-press machine...');
    nfcPuckIntegration.simulateNFCTap('chest-press');
  };

  const handleManualConnect = async () => {
    setTestStatus('Attempting manual connection to chest-press Puck...');
    await nfcPuckIntegration.connectToPuck('chest-press');
  };

  const handleDisconnect = async () => {
    await nfcPuckIntegration.disconnectPuck();
    setTestStatus('Disconnected from Puck');
  };

  const isConnected = connection?.connectionStatus === 'connected';
  const puckState = connection?.puckClient?.getState() || {
    repCount: 0,
    isCalibrated: false,
    sessionActive: false,
    batteryLevel: 1.0,
    lastHeartbeat: 0,
    nfcDetected: false,
    autoConnectTriggered: false
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Nfc className="w-5 h-5" />
          Enhanced NFC Auto-Connect Test
        </CardTitle>
        <CardDescription>
          Test the complete NFC + Puck.js auto-connect system with enhanced firmware v2.0
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge className={`${connection?.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
            {connection?.connectionStatus || 'disconnected'}
          </Badge>
          {isConnected && (
            <Badge variant="outline" className="text-green-600">
              <Wifi className="w-3 h-3 mr-1" />
              Connected to {connection?.machineId}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button onClick={simulateNFCTap} disabled={connection?.isConnecting || isConnected} size="sm">
            <Nfc className="w-4 h-4 mr-2" />
            Simulate NFC Tap
          </Button>
          <Button onClick={handleManualConnect} disabled={connection?.isConnecting || isConnected} variant="outline" size="sm">
            <Bluetooth className="w-4 h-4 mr-2" />
            Manual Connect
          </Button>
          <Button onClick={handleDisconnect} disabled={!isConnected} variant="destructive" size="sm" className="col-span-2">
            Disconnect Puck
          </Button>
        </div>

        <div className="text-xs space-y-1">
          <p><strong>Enhanced Testing Instructions:</strong></p>
          <p>1. Upload the enhanced firmware v2.0 to your Puck.js device</p>
          <p>2. Use "Simulate NFC Tap" to test auto-connect functionality</p>
          <p>3. Monitor LED patterns: Blue=NFC detected, Green=Connected</p>
          <p><strong>Status:</strong> {testStatus}</p>
        </div>
      </CardContent>
    </Card>
  );
}