import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePuckWorkout } from '@/hooks/usePuckWorkout';
import { blePuckUtil } from '@/services/blePuckUtil';
import { toast } from 'sonner';

const SERVICE = '0000FFE0-0000-1000-8000-00805F9B34FB';
const CHAR = '0000FFE1-0000-1000-8000-00805F9B34FB';

interface TestDevice {
  deviceId: string;
  name?: string;
}

export default function PuckTest() {
  const {
    state,
    isReconnecting,
    repCount,
    setNumber,
    restTimeRemaining,
    targetReps,
    targetSets,
    puckState,
    batteryLevel,
    handshake,
    startWorkout,
    endWorkout,
    calibrate
  } = usePuckWorkout();

  const [testDevice, setTestDevice] = useState<TestDevice | null>(null);
  const [testStatus, setTestStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const testConnection = async () => {
    try {
      setTestStatus('connecting');
      const device = await blePuckUtil.connectFirst({
        service: SERVICE,
        timeoutMs: 10000,
        onDisconnect: () => {
          setTestDevice(null);
          setTestStatus('disconnected');
        }
      });
      setTestDevice(device);
      setTestStatus('connected');
      toast.success(`Connected to ${device.name || 'Puck.js'}`);
    } catch (error) {
      setTestStatus('disconnected');
      toast.error('Failed to connect');
    }
  };

  const simulateReps = async (count: number) => {
    if (!testDevice) return;
    try {
      const packet = new Uint8Array([0x01, count & 0xFF]);
      await blePuckUtil.write(testDevice.deviceId, SERVICE, CHAR, packet);
      toast.success(`Simulated ${count} reps`);
    } catch (error) {
      toast.error('Failed to send rep data');
    }
  };

  const disconnectTest = async () => {
    if (testDevice) {
      await blePuckUtil.disconnect(testDevice.deviceId);
      setTestDevice(null);
      setTestStatus('disconnected');
    }
  };

  const getStateDisplay = () => {
    switch (state) {
      case 'idle': return { text: 'Not Connected', color: 'secondary' as const };
      case 'connecting': return { text: 'Connecting...', color: 'default' as const };
      case 'connected': return { text: 'Connected', color: 'default' as const };
      case 'calibrating': return { text: 'Calibrating...', color: 'default' as const };
      case 'awaiting_start': return { text: 'Ready to Start', color: 'default' as const };
      case 'in_set': return { text: `Set ${setNumber} Active`, color: 'default' as const };
      case 'rest': return { text: 'Rest Period', color: 'secondary' as const };
      case 'done': return { text: 'Workout Complete', color: 'default' as const };
      default: return { text: 'Unknown', color: 'destructive' as const };
    }
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Puck.js Rep Counter Test</h1>
        <p className="text-muted-foreground">Test your optimized Puck.js device integration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Workout Session
            <Badge variant={stateDisplay.color}>{stateDisplay.text}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handshake} disabled={state !== 'idle'}>Connect</Button>
            <Button onClick={calibrate} disabled={state === 'idle'} variant="outline">Calibrate</Button>
            <Button onClick={startWorkout} disabled={state === 'idle' || state === 'in_set'}>Start Workout</Button>
            <Button onClick={endWorkout} disabled={state === 'idle'} variant="destructive">End</Button>
          </div>

          {puckState && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded">
              <div><span className="text-sm text-muted-foreground">Battery:</span> {Math.round(batteryLevel * 100)}%</div>
              <div><span className="text-sm text-muted-foreground">Calibrated:</span> {puckState.isCalibrated ? 'Yes' : 'No'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={testStatus !== 'disconnected'}>Connect Test Device</Button>
            <Button onClick={() => simulateReps(1)} disabled={testStatus !== 'connected'} variant="outline">Send 1 Rep</Button>
            <Button onClick={() => simulateReps(5)} disabled={testStatus !== 'connected'} variant="outline">Send 5 Reps</Button>
            <Button onClick={disconnectTest} disabled={testStatus !== 'connected'} variant="destructive">Disconnect</Button>
          </div>
        </CardContent>
      </Card>

      {(state === 'in_set' || state === 'rest' || state === 'done') && (
        <Card>
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Set {setNumber} of {targetSets}</span>
                  <span>{repCount} / {targetReps} reps</span>
                </div>
                <Progress value={(repCount / targetReps) * 100} />
              </div>
              {state === 'rest' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Rest Time</span>
                    <span>{restTimeRemaining}s remaining</span>
                  </div>
                  <Progress value={((90 - restTimeRemaining) / 90) * 100} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}