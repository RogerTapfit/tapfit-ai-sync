import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBLESensor } from '@/hooks/useBLESensor';
import { useTapCoins } from '@/hooks/useTapCoins';
import { HealthMetricsPanel } from './HealthMetricsPanel';
import { 
  Bluetooth, 
  BluetoothConnected, 
  Play, 
  Square, 
  Activity,
  Timer,
  Zap
} from 'lucide-react';

export const LiveWorkoutSession: React.FC = () => {
  const navigate = useNavigate();
  const {
    connectionStatus,
    isConnected,
    isScanning,
    currentSession,
    isSessionActive,
    realtimeReps,
    lastMotionTime,
    startScanning,
    stopScanning,
    disconnect,
    startWorkoutSession,
    endWorkoutSession
  } = useBLESensor();
  
  const { awardCoins } = useTapCoins();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusDisplay = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2">
          <BluetoothConnected className="w-4 h-4 text-green-500" />
          <span className="text-green-500 font-medium">
            Connected to {connectionStatus.deviceName}
          </span>
          <Badge variant="default" className="ml-2 bg-green-100 text-green-800 border-green-200">Live</Badge>
        </div>
      );
    } else if (isScanning) {
      return (
        <div className="flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-blue-500">Searching for Puck.js...</span>
          <Badge variant="secondary" className="ml-2">Scanning</Badge>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Not connected</span>
          <Badge variant="outline" className="ml-2">Offline</Badge>
        </div>
      );
    }
  };

  const getLastActivityDisplay = () => {
    if (!lastMotionTime) return 'No activity detected';
    
    const secondsSinceActivity = Math.floor((Date.now() - lastMotionTime.getTime()) / 1000);
    if (secondsSinceActivity < 5) return 'Active now';
    if (secondsSinceActivity < 60) return `${secondsSinceActivity}s ago`;
    
    const minutesSinceActivity = Math.floor(secondsSinceActivity / 60);
    return `${minutesSinceActivity}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>BLE Sensor Connection</span>
            <div className="flex gap-2">
              {!isConnected && !isScanning && (
                <Button 
                  onClick={startScanning}
                  size="sm"
                  variant="outline"
                >
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Scan for Devices
                </Button>
              )}
              {isScanning && (
                <Button 
                  onClick={stopScanning}
                  size="sm"
                  variant="outline"
                >
                  Stop Scanning
                </Button>
              )}
              {isConnected && (
                <Button 
                  onClick={disconnect}
                  size="sm"
                  variant="destructive"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getConnectionStatusDisplay()}
          {connectionStatus.deviceId && (
            <div className="mt-2 text-sm text-muted-foreground">
              Device ID: {connectionStatus.deviceId}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Workout Display */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Workout Session</span>
              <div className="flex gap-2">
                {!isSessionActive ? (
                  <Button 
                    onClick={startWorkoutSession}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <Button 
                    onClick={async () => {
                      // Award coins for completing workout session
                      if (currentSession) {
                        const sessionMinutes = Math.floor(currentSession.activeTime / 60);
                        // 100 reps = 1 tap coin (each rep = 1 cent)
                        const repCoins = Math.floor(realtimeReps / 100);
                        const totalCoins = repCoins;
                        
                        await awardCoins(totalCoins, 'earn_workout', `Completed BLE sensor workout: ${realtimeReps} reps in ${sessionMinutes} minutes`);
                        
                        // Navigate to workout summary
                        navigate('/workout-summary', {
                          state: {
                            workoutData: {
                              name: "BLE Sensor Workout",
                              exercises: 1,
                              duration: sessionMinutes,
                              sets: Math.ceil(realtimeReps / 10), // Estimate sets
                              totalReps: realtimeReps,
                              notes: `Sensor workout completed with ${realtimeReps} reps`
                            }
                          }
                        });
                      }
                      
                      endWorkoutSession();
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSessionActive && currentSession ? (
              <div className="space-y-6">
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {realtimeReps}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Reps</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {formatTime(currentSession.activeTime)}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Time</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium mb-1 flex items-center justify-center gap-1">
                      <Activity className="w-4 h-4" />
                      Last Activity
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getLastActivityDisplay()}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Session Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session Started:</span>
                    <span>{currentSession.startTime.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Points:</span>
                    <span>{currentSession.sensorData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Reps/Min:</span>
                    <span>
                      {currentSession.activeTime > 0 
                        ? Math.round((realtimeReps / currentSession.activeTime) * 60) 
                        : 0}
                    </span>
                  </div>
                </div>

                {/* Real-time Activity Indicator */}
                {lastMotionTime && (Date.now() - lastMotionTime.getTime()) < 5000 && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Zap className="w-4 h-4 text-green-600 animate-pulse" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Motion detected!
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a workout session to begin tracking</p>
                <p className="text-sm mt-2">
                  Your reps will be automatically counted when motion is detected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apple Watch Health Monitoring */}
      <HealthMetricsPanel isWorkoutActive={isSessionActive} />

      {/* Instructions Card */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Setup your Puck.js device:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Ensure your Puck.js is powered on</li>
                <li>• Make sure it's within Bluetooth range</li>
                <li>• Check that the device name contains "Puck.js"</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Connect your device:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Tap "Scan for Devices" above</li>
                <li>• The app will automatically connect to the closest Puck.js</li>
                <li>• Once connected, you can start a workout session</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Start tracking:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Begin your workout movements</li>
                <li>• Reps will be automatically counted</li>
                <li>• Session data is saved to your workout history</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};