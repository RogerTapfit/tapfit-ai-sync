import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePuckWorkout } from '@/hooks/usePuckWorkout';
import { useLocation } from 'react-router-dom';

interface SmartPuckWorkoutRunnerProps {
  autoConnect?: boolean;
  onDone?: () => void;
  onStart?: () => void;
}

export const SmartPuckWorkoutRunner: React.FC<SmartPuckWorkoutRunnerProps> = ({ autoConnect, onDone, onStart }) => {
  const { state, isReconnecting, startWorkout, endWorkout, handshake } = usePuckWorkout(false);
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ac = autoConnect || params.get('autoConnect') === 'puck' || params.get('autoConnect') === '1';
    const as = params.get('autoStart') === '1' || params.get('autoStart') === 'true';
    if (ac) {
      handshake().then(() => {
        if (as) startWorkout();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, location.search]);

  useEffect(() => {
    if (state.kind === 'done') {
      onDone?.();
    }
  }, [state.kind, onDone]);

  const RestView = () => {
    if (state.kind !== 'rest') return null;
    const pct = Math.round(((90 - state.seconds) / 90) * 100);
    const mm = String(Math.floor(state.seconds / 60)).padStart(2, '0');
    const ss = String(state.seconds % 60).padStart(2, '0');
    return (
      <div className="text-center space-y-4">
        <div className="text-sm text-muted-foreground">Rest</div>
        <div className="text-5xl font-bold tracking-tight">{mm}:{ss}</div>
        <Progress value={pct} className="h-2" />
        <div className="text-sm text-muted-foreground">Next: Set {Math.min(state.setIndex + 1, 4)}</div>
      </div>
    );
  };

  const InSetView = () => {
    if (state.kind !== 'inSet') return null;
    return (
      <div className="text-center space-y-4">
        <div className="text-sm text-muted-foreground">Set {state.setIndex}/4</div>
        <div className="text-6xl font-extrabold tracking-tight">
          {state.reps}
          <span className="text-foreground/50 text-3xl">/10</span>
        </div>
        <div className="text-xs text-muted-foreground">Tap puck to count reps</div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {isReconnecting && (
          <div className="w-full text-center text-amber-600 text-sm">Puck disconnected – reconnecting…</div>
        )}

        {(state.kind === 'idle' || state.kind === 'awaitStart') && (
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" onClick={() => (onStart ? onStart() : startWorkout())}>
              Start Workout
            </Button>
            {state.kind === 'awaitStart' ? (
              <p className="text-xs text-muted-foreground">Connected — tap Start when you're ready.</p>
            ) : (
              <p className="text-xs text-muted-foreground">We'll connect to your puck and reset reps</p>
            )}
          </div>
        )}

        {state.kind === 'connecting' && (
          <div className="text-center text-sm text-muted-foreground">Connecting to Puck…</div>
        )}

        {state.kind === 'inSet' && <InSetView />}
        {state.kind === 'rest' && <RestView />}
        {state.kind === 'done' && (
          <div className="text-center text-sm">Workout complete! 🎉</div>
        )}

        {(state.kind === 'inSet' || state.kind === 'rest') && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={endWorkout}>End Workout</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
