import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveWorkoutSession } from '@/components/LiveWorkoutSession';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Bluetooth, Activity, BarChart3, ArrowLeft, Nfc, Zap, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nfcPuckIntegration, type NFCPuckConnection } from '@/services/nfcPuckIntegration';
import { nfcService, MACHINE_IDS, type MachineId } from '@/services/nfcService';

export default function SensorWorkout() {
  const navigate = useNavigate();
  const [nfcConnection, setNfcConnection] = useState<NFCPuckConnection | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<MachineId>('chest-press');

  const handleBack = () => {
    navigate('/');
  };

  // Initialize NFC integration
  useEffect(() => {
    const initializeNFC = async () => {
      try {
        const isSupported = await nfcService.isNFCAvailable();
        setNfcSupported(isSupported);
        
        if (isSupported) {
          await nfcPuckIntegration.initialize();
        }
      } catch (error) {
        console.error('NFC initialization failed:', error);
      }
    };

    initializeNFC();

    // Subscribe to connection changes
    const unsubscribe = nfcPuckIntegration.onConnectionChange((connection) => {
      setNfcConnection(connection);
    });

    return () => {
      unsubscribe();
      nfcPuckIntegration.stopNFCListening();
    };
  }, []);

  const handleSimulateNFC = () => {
    nfcPuckIntegration.simulateNFCTap(selectedMachine);
  };

  const handleWriteNFCTag = async () => {
    try {
      await nfcPuckIntegration.writeNFCTag(selectedMachine);
    } catch (error) {
      console.error('Failed to write NFC tag:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Smart Sensor Workouts</h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-primary">
          Real-time BLE Tracking
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect your Puck.js BLE sensor for real-time rep counting and motion tracking
        </p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Session
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4" />
            Setup Guide
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          {/* NFC Status Panel */}
          {nfcSupported && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Nfc className="w-5 h-5" />
                  NFC Auto-Connect
                  {nfcConnection?.isConnecting && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                      Connecting...
                    </Badge>
                  )}
                  {nfcConnection?.connectionStatus === 'connected' && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Connected via NFC
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tap an NFC tag to automatically connect to your Puck.js device and start tracking.
                  </p>
                  
                  {/* Machine Selection for Testing */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Machine:</label>
                    <select 
                      value={selectedMachine} 
                      onChange={(e) => setSelectedMachine(e.target.value as MachineId)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      {Object.entries(MACHINE_IDS).map(([id, details]) => (
                        <option key={id} value={id}>{details.machine}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSimulateNFC}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Simulate NFC Tap
                    </Button>
                    <Button 
                      onClick={handleWriteNFCTag}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Scan className="w-4 h-4" />
                      Write NFC Tag
                    </Button>
                  </div>
                  
                  {nfcConnection && (
                    <div className="text-xs text-muted-foreground">
                      Status: {nfcConnection.connectionStatus} | Machine: {nfcConnection.machineId}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <LiveWorkoutSession autoConnect={nfcConnection?.connectionStatus === 'connected'} />
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Puck.js Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bluetooth className="w-5 h-5" />
                  Puck.js v2.1 Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Hardware Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Puck.js v2.1 device</li>
                      <li>• Fresh CR2032 battery</li>
                      <li>• Bluetooth 5.0 compatible phone</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Firmware Setup:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Flash motion detection firmware</li>
                      <li>• Configure UART service (FFE0/FFE1)</li>
                      <li>• Set device name to "Puck.js"</li>
                      <li>• Enable accelerometer notifications</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Data Format:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Byte[0]: Data type (0x01=rep, 0x02=motion)</li>
                      <li>• Byte[1]: Value (rep count or intensity)</li>
                      <li>• Updates sent on movement detection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile App Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Mobile App Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">iOS Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• iOS 13.0 or later</li>
                      <li>• Bluetooth permissions enabled</li>
                      <li>• Location services (for BLE scanning)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Android Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Android 8.0 or later</li>
                      <li>• Bluetooth and location permissions</li>
                      <li>• Device location enabled</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Setup Steps:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>1. Export project to GitHub</li>
                      <li>2. Run `npm install` and `npx cap add ios/android`</li>
                      <li>3. Build with `npm run build && npx cap sync`</li>
                      <li>4. Run with `npx cap run ios/android`</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">NFC Auto-Connect:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Write NFC tags with machine-specific URLs</li>
                      <li>• Tap to automatically connect Puck.js</li>
                      <li>• No manual scanning required</li>
                      <li>• Seamless workout start experience</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Connection Issues:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure Puck.js is within 10m range</li>
                    <li>• Check battery level on Puck.js</li>
                    <li>• Restart Bluetooth on phone</li>
                    <li>• Clear app cache and retry</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Data Issues:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Verify firmware is latest version</li>
                    <li>• Check accelerometer sensitivity</li>
                    <li>• Ensure proper mounting on equipment</li>
                    <li>• Calibrate motion thresholds</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sensor Analytics Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Advanced sensor analytics are in development</p>
                <p className="text-sm">
                  This will include motion patterns, rep quality analysis, 
                  and workout intensity metrics from your BLE sensors.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Live rep counting and motion detection with immediate feedback
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Bluetooth className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">BLE Integration</h3>
            <p className="text-sm text-muted-foreground">
              Seamless connection to Puck.js and other BLE fitness sensors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Data Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive workout analysis and progress tracking
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}