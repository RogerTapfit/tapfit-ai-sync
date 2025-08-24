import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Wifi, WifiOff, Zap, Battery, Activity, Smartphone } from 'lucide-react';
import { PuckClient, PuckState, PuckStatus } from '@/ble/puckClient';
import { toast } from 'sonner';

interface NFCPuckTestPanelProps {
  onPuckConnected?: (puckClient: PuckClient) => void;
}

export const NFCPuckTestPanel: React.FC<NFCPuckTestPanelProps> = ({ onPuckConnected }) => {
  const [puckClient, setPuckClient] = useState<PuckClient | null>(null);
  const [testStatus, setTestStatus] = useState<string>('Ready for NFC auto-connect test');
  const [connectionStatus, setConnectionStatus] = useState<PuckStatus>('disconnected');
  const [puckState, setPuckState] = useState<PuckState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleStatusUpdate = (status: PuckStatus) => {
    setConnectionStatus(status);
    
    switch (status) {
      case 'handshaking':
        setTestStatus('Establishing connection with Puck...');
        break;
      case 'connected':
        setTestStatus('Successfully connected to Puck!');
        toast.success('Puck connected via NFC auto-connect');
        break;
      case 'disconnected':
        setTestStatus('Puck disconnected');
        setPuckState(null);
        break;
      case 'error':
        setTestStatus('Connection error occurred');
        toast.error('Puck connection failed');
        break;
      case 'nfc_detected':
        setTestStatus('NFC tap detected - initiating auto-connect...');
        break;
      case 'auto_connect_signal':
        setTestStatus('Auto-connect signal received from Puck');
        break;
    }
  };

  const handleRepUpdate = (repCount: number) => {
    setTestStatus(`Rep count updated: ${repCount}`);
  };

  const handleStateUpdate = (state: PuckState) => {
    setPuckState(state);
    
    if (state.nfcDetected) {
      setTestStatus('NFC tap detected on Puck device');
    }
    
    if (state.autoConnectTriggered) {
      setTestStatus('Auto-connect triggered via NFC');
    }
  };

  const simulateNFCTap = async () => {
    setTestStatus('Simulating NFC tap and auto-connect...');
    setIsConnecting(true);
    
    try {
      // Create new PuckClient with callbacks
      const client = new PuckClient(
        handleStatusUpdate,
        handleRepUpdate,
        handleStateUpdate
      );
      
      setPuckClient(client);
      
      // Attempt handshake (simulating NFC-triggered connection)
      await client.handshake();
      
      // Simulate NFC acknowledgment after connection
      setTimeout(async () => {
        if (client) {
          await client.sendCommand(0x06); // NFC_ACK command
          setTestStatus('NFC acknowledgment sent to Puck');
        }
      }, 1000);
      
      onPuckConnected?.(client);
      
    } catch (error) {
      setTestStatus(`NFC auto-connect failed: ${error}`);
      toast.error('Failed to connect via NFC simulation');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    setTestStatus('Attempting manual BLE connection...');
    setIsConnecting(true);
    
    try {
      const client = new PuckClient(
        handleStatusUpdate,
        handleRepUpdate,
        handleStateUpdate
      );
      
      setPuckClient(client);
      await client.handshake();
      onPuckConnected?.(client);
      
    } catch (error) {
      setTestStatus(`Manual connection failed: ${error}`);
      toast.error('Manual connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (puckClient) {
      await puckClient.disconnect();
      setPuckClient(null);
      setTestStatus('Disconnected from Puck');
    }
  };

  const simulateRep = async () => {
    if (puckClient) {
      try {
        // Send a test rep command
        await puckClient.sendCommand(0x10); // Custom test rep command
        setTestStatus('Test rep sent to Puck');
        toast.success('Rep simulation sent');
      } catch (error) {
        setTestStatus(`Rep simulation failed: ${error}`);
        toast.error('Failed to simulate rep');
      }
    }
  };

  const startSession = async () => {
    if (puckClient) {
      try {
        await puckClient.startSession();
        setTestStatus('Workout session started on Puck');
        toast.success('Session started');
      } catch (error) {
        setTestStatus(`Failed to start session: ${error}`);
      }
    }
  };

  const endSession = async () => {
    if (puckClient) {
      try {
        await puckClient.endSession();
        setTestStatus('Workout session ended');
        toast.success('Session ended');
      } catch (error) {
        setTestStatus(`Failed to end session: ${error}`);
      }
    }
  };

  const calibratePuck = async () => {
    if (puckClient) {
      try {
        await puckClient.calibrate();
        setTestStatus('Calibration initiated on Puck');
        toast.success('Calibration started');
      } catch (error) {
        setTestStatus(`Calibration failed: ${error}`);
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes('connected') || status.includes('Successfully')) return 'default';
    if (status.includes('failed') || status.includes('error')) return 'destructive';
    if (status.includes('connecting') || status.includes('attempting')) return 'secondary';
    return 'outline';
  };

  const isConnected = connectionStatus === 'connected' || connectionStatus === 'session_active';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          NFC + Puck.js Auto-Connect Test
        </CardTitle>
        <CardDescription>
          Test NFC tap detection and automatic BLE connection with your Puck.js device
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection Status</span>
            <Badge variant={getStatusBadgeVariant(testStatus)}>
              {isConnected ? (
                <><Wifi className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
              )}
            </Badge>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{testStatus}</p>
          </div>
        </div>

        <Separator />

        {/* Test Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connection Test</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={simulateNFCTap} 
              disabled={isConnecting || isConnected}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Simulate NFC Tap
            </Button>
            
            <Button 
              onClick={handleManualConnect}
              disabled={isConnecting || isConnected}
              variant="outline"
            >
              Manual Connect
            </Button>
            
            <Button 
              onClick={handleDisconnect}
              disabled={!isConnected}
              variant="destructive"
            >
              Disconnect
            </Button>
            
            <Button 
              onClick={calibratePuck}
              disabled={!isConnected}
              variant="outline"
            >
              Calibrate
            </Button>
          </div>
        </div>

        {/* Session Controls */}
        {isConnected && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Session Controls</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <Button onClick={startSession} variant="default" size="sm">
                  Start Session
                </Button>
                <Button onClick={simulateRep} variant="outline" size="sm">
                  Simulate Rep
                </Button>
                <Button onClick={endSession} variant="destructive" size="sm">
                  End Session
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Live Data */}
        {isConnected && puckState && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Live Data</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Rep Count</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{puckState.repCount}</div>
                  <div className="text-xs text-muted-foreground">
                    Session: {puckState.sessionActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4" />
                    <span className="text-sm font-medium">Battery</span>
                  </div>
                  <div className="text-lg font-semibold">{Math.round(puckState.batteryLevel * 100)}%</div>
                  <Progress value={puckState.batteryLevel * 100} className="w-full" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Calibrated:</span> {puckState.isCalibrated ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">NFC Detected:</span> {puckState.nfcDetected ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to Test NFC Auto-Connect
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Load the NFC test firmware onto your Puck.js device</li>
            <li>Click "Simulate NFC Tap" to test the auto-connect flow</li>
            <li>Watch for LED feedback on your Puck (green for connection, blue for NFC)</li>
            <li>Monitor connection status and live data updates</li>
            <li>Test rep counting and session management</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};