import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePuckWorkout } from '@/hooks/usePuckWorkout';
import { Progress } from '@/components/ui/progress';
import { Activity, Bluetooth, Timer, Target } from 'lucide-react';

export default function PuckTest() {
  const { state, isReconnecting, handshake, startWorkout, endWorkout } = usePuckWorkout();

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