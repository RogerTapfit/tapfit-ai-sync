import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEnhancedNFCBLE } from '@/hooks/useEnhancedNFCBLE';
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
import { AvatarDisplay } from './AvatarDisplay';
import { useAvatar } from '@/hooks/useAvatar';

interface LiveWorkoutSessionProps {
  autoConnect?: boolean;
}

export const LiveWorkoutSession: React.FC<LiveWorkoutSessionProps> = ({ autoConnect = false }) => {
  const navigate = useNavigate();
  const { avatarData } = useAvatar();
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    deviceName,
    deviceId,
    nfcSupported,
    nfcConnection,
    isNFCTriggeredConnection,
    repCount,
    batteryLevel,
    isSessionActive,
    sessionStartTime,
    lastActivityTime,
    connect,
    disconnect,
    startSession,
    endSession,
    simulateNFCTap,
    writeNFCTag,
    calibrate,
    reset
  } = useEnhancedNFCBLE();
  
  const { awardCoins } = useTapCoins();

  // Auto-connect when autoConnect prop is true
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting, connect]);

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
            Connected to {deviceName || 'TapFit-Puck'}
          </span>
          <Badge variant="default" className="ml-2 bg-green-100 text-green-800 border-green-200">
            {isNFCTriggeredConnection ? 'NFC' : 'BLE'}
          </Badge>
          <Badge variant="default" className="ml-1 bg-green-100 text-green-800 border-green-200">
            Live
          </Badge>
        </div>
      );
    } else if (isConnecting) {
      return (
        <div className="flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-blue-500">Connecting to Puck.js...</span>
          <Badge variant="secondary" className="ml-2">Connecting</Badge>
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
    if (!lastActivityTime) return 'No activity detected';
    
    const secondsSinceActivity = Math.floor((Date.now() - lastActivityTime.getTime()) / 1000);
    if (secondsSinceActivity < 5) return 'Active now';
    if (secondsSinceActivity < 60) return `${secondsSinceActivity}s ago`;
    
    const minutesSinceActivity = Math.floor(secondsSinceActivity / 60);
    return `${minutesSinceActivity}m ago`;
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>BLE Sensor Connection</span>
            <div className="flex gap-2">
              {autoConnect && isConnecting && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                  Auto-connecting...
                </Badge>
              )}
              {!isConnected && !isConnecting && !autoConnect && (
                <Button 
                  onClick={connect}
                  size="sm"
                  variant="outline"
                >
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Connect to Puck
                </Button>
              )}
              {isConnecting && !autoConnect && (
                <Button 
                  onClick={disconnect}
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Connecting...
                </Button>
              )}
              {isConnected && (
                <div className="flex gap-2">
                  <Button 
                    onClick={calibrate}
                    size="sm"
                    variant="outline"
                  >
                    Calibrate
                  </Button>
                  <Button 
                    onClick={disconnect}
                    size="sm"
                    variant="destructive"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getConnectionStatusDisplay()}
          
          {/* Enhanced connection info */}
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {deviceId && (
              <div>Device ID: {deviceId}</div>
            )}
            {isConnected && (
              <div className="flex justify-between">
                <span>Battery Level:</span>
                <span className={batteryLevel < 20 ? 'text-red-500 font-medium' : ''}>{batteryLevel}%</span>
              </div>
            )}  
            {nfcConnection && (
              <div>NFC Machine: {nfcConnection.machineId}</div>
            )}
          </div>
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
                    onClick={startSession}
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
                      const sessionMinutes = Math.floor(getSessionDuration() / 60);
                      // 100 reps = 1 tap coin (each rep = 1 cent)
                      const repCoins = Math.floor(repCount / 100);
                      const totalCoins = repCoins;
                      
                      await awardCoins(totalCoins, 'earn_workout', `Completed NFC-BLE sensor workout: ${repCount} reps in ${sessionMinutes} minutes`);
                      
                      // Navigate to workout summary
                      navigate('/workout-summary', {
                        state: {
                          workoutData: {
                            name: "TapFit Puck Workout",
                            exercises: 1,
                            duration: sessionMinutes,
                            sets: Math.ceil(repCount / 10), // Estimate sets
                            totalReps: repCount,
                            notes: `Puck sensor workout completed with ${repCount} reps via ${isNFCTriggeredConnection ? 'NFC' : 'BLE'} connection`
                          }
                        }
                      });
                      
                      await endSession();
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
            {isSessionActive && sessionStartTime ? (
              <div className="space-y-6">
                {/* Motivational Avatar */}
                <div className="flex justify-center mb-6">
                  {avatarData && (
                    <div className="relative">
                      <AvatarDisplay 
                        avatarData={avatarData} 
                        size="medium" 
                        showAnimation={true}
                        emotion={lastActivityTime && (Date.now() - lastActivityTime.getTime()) < 5000 ? 'excited' : 'focused'}
                        pose={lastActivityTime && (Date.now() - lastActivityTime.getTime()) < 5000 ? 'workout' : 'idle'}
                      />
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-3 py-1 text-xs font-bold shadow-lg border-2 border-primary">
                        {repCount === 0 ? "Let's go!" : 
                         repCount < 10 ? "Great start!" :
                         repCount < 25 ? "Keep it up!" :
                         repCount < 50 ? "You're on fire!" :
                         "Amazing work!"}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {repCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Reps</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {formatTime(getSessionDuration())}
                    </div>
                    <div className="text-sm text-muted-foreground">Session Time</div>
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
                    <span>{sessionStartTime.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connection Type:</span>
                    <span>{isNFCTriggeredConnection ? 'NFC Auto-Connect' : 'Manual BLE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Reps/Min:</span>
                    <span>
                      {getSessionDuration() > 0 
                        ? Math.round((repCount / getSessionDuration()) * 60) 
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Battery Level:</span>
                    <span className={batteryLevel < 20 ? 'text-red-500 font-medium' : ''}>{batteryLevel}%</span>
                  </div>
                </div>

                {/* Real-time Activity Indicator */}
                {lastActivityTime && (Date.now() - lastActivityTime.getTime()) < 5000 && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Zap className="w-4 h-4 text-green-600 animate-pulse" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Rep detected! Keep going!
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
                <li>• Check that the device name contains "TapFit"</li>
                <li>• Upload the enhanced NFC firmware for auto-connect capability</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Connection options:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>NFC Auto-Connect:</strong> Tap a programmed NFC tag for instant connection</li>
                <li>• <strong>Manual Connect:</strong> Use "Scan for Devices" button above</li>
                <li>• <strong>Auto-Discovery:</strong> App automatically connects to closest Puck.js</li>
                <li>• NFC tags support machine-specific configurations</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Start tracking:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Begin your workout movements with connected sensor</li>
                <li>• Reps are automatically counted via motion detection</li>
                <li>• Session data syncs to your workout history</li>
                <li>• NFC detection triggers automatic session start</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Firmware requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Use: <code className="text-xs bg-muted px-1 rounded">puck_v8.3_app_1.2.7_ios_optimized.js</code></li>
                <li>• Supports Nordic UART Service (6E40 series UUID)</li>
                <li>• Binary protocol for reliable communication</li>
                <li>• NFC field detection with auto-advertising boost</li>
                <li>• iOS-optimized BLE settings and enhanced battery monitoring</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};