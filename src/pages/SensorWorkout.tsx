import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveWorkoutSession } from '@/components/LiveWorkoutSession';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Bluetooth, Activity, BarChart3 } from 'lucide-react';

export default function SensorWorkout() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          Smart Sensor Workouts
        </h1>
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
          <LiveWorkoutSession />
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