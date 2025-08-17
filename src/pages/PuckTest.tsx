import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePuckWorkout } from '@/hooks/usePuckWorkout';
import { Progress } from '@/components/ui/progress';
import { Activity, Bluetooth, Timer, Target, TestTube, Zap } from 'lucide-react';
import { blePuckUtil } from '@/services/blePuckUtil';
import { toast } from 'sonner';

export default function PuckTest() {
  const { state, isReconnecting, handshake, startWorkout, endWorkout } = usePuckWorkout();
  const [testDevice, setTestDevice] = useState<{ deviceId: string; name?: string } | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'connecting' | 'connected' | 'testing'>('idle');

  const SERVICE = '0000FFE0-0000-1000-8000-00805F9B34FB';
  const CHAR = '0000FFE1-0000-1000-8000-00805F9B34FB';

  const testConnection = async () => {
    setTestStatus('connecting');
    try {
      const device = await blePuckUtil.connectFirst({ 
        service: SERVICE, 
        timeoutMs: 10000,
        onDisconnect: () => {
          setTestDevice(null);
          setTestStatus('idle');
        }
      });
      setTestDevice(device);
      setTestStatus('connected');
      toast.success(`Connected to ${device.name || 'Puck.js'}`);
    } catch (e) {
      setTestStatus('idle');
      toast.error('Failed to connect to Puck.js');
      console.error('Connection failed:', e);
    }
  };

  const simulateReps = async (repCount: number) => {
    if (!testDevice?.deviceId) {
      toast.error('Not connected to Puck.js');
      return;
    }
    
    setTestStatus('testing');
    try {
      // Reset first
      await blePuckUtil.write(testDevice.deviceId, SERVICE, CHAR, new Uint8Array([0x00]));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send rep count
      await blePuckUtil.write(testDevice.deviceId, SERVICE, CHAR, new Uint8Array([0x01, repCount]));
      toast.success(`Simulated ${repCount} reps sent to Puck.js`);
    } catch (e) {
      toast.error('Failed to send test data');
      console.error('Test failed:', e);
    } finally {
      setTestStatus('connected');
    }
  };

  const disconnectTest = async () => {
    if (testDevice?.deviceId) {
      await blePuckUtil.disconnect(testDevice.deviceId);
    }
    setTestDevice(null);
    setTestStatus('idle');
  };

  const getStateDisplay = () => {
    switch (state.kind) {
      case 'idle':
        return { text: 'Disconnected', color: 'secondary' as const };
      case 'connecting':
        return { text: 'Connecting...', color: 'default' as const };
      case 'awaitStart':
        return { text: 'Ready to Start', color: 'default' as const };
      case 'inSet':
        return { text: `Set ${state.setIndex} Active`, color: 'default' as const };
      case 'rest':
        return { text: `Rest Period`, color: 'secondary' as const };
      case 'done':
        return { text: 'Workout Complete', color: 'default' as const };
    }
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Puck.js Rep Counter Test</h1>
        <p className="text-muted-foreground">Test real-time rep counting with your Puck.js device</p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant={stateDisplay.color}>{stateDisplay.text}</Badge>
            {isReconnecting && <span className="text-sm text-muted-foreground">Reconnecting...</span>}
          </div>
          
          <div className="flex gap-2 mt-4">
            {state.kind === 'idle' && (
              <Button onClick={handshake}>
                <Bluetooth className="h-4 w-4 mr-2" />
                Connect to Puck.js
              </Button>
            )}
            
            {state.kind === 'awaitStart' && (
              <Button onClick={startWorkout}>
                <Activity className="h-4 w-4 mr-2" />
                Start Workout
              </Button>
            )}
            
            {(state.kind === 'inSet' || state.kind === 'rest') && (
              <Button variant="destructive" onClick={endWorkout}>
                End Workout
              </Button>
            )}
            
            {state.kind === 'done' && (
              <Button onClick={() => window.location.reload()}>
                Start New Test
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rep Tester */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Rep Tester
          </CardTitle>
          <CardDescription>
            Test Puck.js connection and simulate rep counts to verify communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge variant={testStatus === 'connected' ? 'default' : 'secondary'}>
              {testStatus === 'idle' && 'Not Connected'}
              {testStatus === 'connecting' && 'Connecting...'}
              {testStatus === 'connected' && `Connected: ${testDevice?.name || 'Puck.js'}`}
              {testStatus === 'testing' && 'Testing...'}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {testStatus === 'idle' && (
              <Button onClick={testConnection} className="w-full">
                <Bluetooth className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            )}
            
            {testStatus === 'connected' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button onClick={() => simulateReps(1)} size="sm">
                  <Zap className="h-3 w-3 mr-1" />
                  1 Rep
                </Button>
                <Button onClick={() => simulateReps(5)} size="sm">
                  <Zap className="h-3 w-3 mr-1" />
                  5 Reps
                </Button>
                <Button onClick={() => simulateReps(10)} size="sm">
                  <Zap className="h-3 w-3 mr-1" />
                  10 Reps
                </Button>
                <Button onClick={disconnectTest} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            )}
            
            {(testStatus === 'connecting' || testStatus === 'testing') && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Rep Counter */}
      {(state.kind === 'inSet' || state.kind === 'rest' || state.kind === 'done') && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Live Rep Counter
            </CardTitle>
            <CardDescription>
              Real-time rep counting from Puck.js accelerometer (2.0G+ detection)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.kind === 'inSet' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">{state.reps}</div>
                  <div className="text-lg text-muted-foreground">Set {state.setIndex} of 4</div>
                  <Progress value={(state.reps / 10) * 100} className="mt-2" />
                  <div className="text-sm text-muted-foreground mt-1">{state.reps}/10 reps</div>
                </div>
              </div>
            )}
            
            {state.kind === 'rest' && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-5 w-5" />
                  <span className="text-lg">Rest Time</span>
                </div>
                <div className="text-4xl font-bold">{state.seconds}s</div>
                <Progress value={((90 - state.seconds) / 90) * 100} className="mt-2" />
                <div className="text-sm text-muted-foreground">
                  Next: Set {state.setIndex + 1} of 4
                </div>
              </div>
            )}
            
            {state.kind === 'done' && (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-green-600">✓ Complete!</div>
                <div className="text-lg">4 sets completed</div>
                <div className="text-sm text-muted-foreground">
                  Total: 40 reps detected via Puck.js
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Prepare Puck.js</h4>
            <p className="text-sm text-muted-foreground">
              Upload the firmware from <code>src/assets/puckjs-firmware-v6.js</code> to your Puck.js using the Espruino Web IDE
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Position Device</h4>
            <p className="text-sm text-muted-foreground">
              Attach the Puck.js to your workout equipment (weight, dumbbell, etc.)
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Connect & Test</h4>
            <p className="text-sm text-muted-foreground">
              Click "Connect to Puck.js" above and start your workout. The device will detect reps when G-force exceeds 2.0G
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">4. Real-time Feedback</h4>
            <p className="text-sm text-muted-foreground">
              Rep counts will appear instantly with ~200ms latency. The system tracks 4 sets of 10 reps with 90-second rest periods
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}