import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { connectNearest, type BlePairCallbacks } from "@/lib/blePair";

type MachineId = 'LEGEXT01' | 'CHESTPRESS01' | 'LATPULL01' | 'SHOULDERPRESS01' | 'LEGPRESS01' | 'BICEP01' | 'TRICEP01' | 'SQUAT01';

const testMachines: Array<{
  id: MachineId;
  name: string;
  muscleGroup: string;
  url: string;
}> = [
  { id: 'LEGEXT01', name: 'Leg Extension', muscleGroup: 'Quadriceps', url: 'https://tapfit.info/pair?station=LEGEXT01' },
  { id: 'CHESTPRESS01', name: 'Chest Press', muscleGroup: 'Chest', url: 'https://tapfit.info/pair?station=CHESTPRESS01' },
  { id: 'LATPULL01', name: 'Lat Pulldown', muscleGroup: 'Back', url: 'https://tapfit.info/pair?station=LATPULL01' },
  { id: 'SHOULDERPRESS01', name: 'Shoulder Press', muscleGroup: 'Shoulders', url: 'https://tapfit.info/pair?station=SHOULDERPRESS01' },
  { id: 'LEGPRESS01', name: 'Leg Press', muscleGroup: 'Legs', url: 'https://tapfit.info/pair?station=LEGPRESS01' },
  { id: 'BICEP01', name: 'Bicep Curl', muscleGroup: 'Biceps', url: 'https://tapfit.info/pair?station=BICEP01' },
  { id: 'TRICEP01', name: 'Tricep Extension', muscleGroup: 'Triceps', url: 'https://tapfit.info/pair?station=TRICEP01' },
  { id: 'SQUAT01', name: 'Squat Rack', muscleGroup: 'Full Body', url: 'https://tapfit.info/pair?station=SQUAT01' },
];

export function NFCTestPanel() {
  const navigate = useNavigate();

  const handleTestMachine = async (machineId: MachineId) => {
    const machine = testMachines.find(m => m.id === machineId);
    if (!machine) return;

    toast.success(`NFC tap simulated for ${machine.name} - Starting BLE connection...`);
    console.log(`Simulating NFC tap for machine: ${machineId}`);
    
    // Create callbacks for this test connection
    const callbacks: BlePairCallbacks = {
      onStatusUpdate: (status) => {
        toast.info(`Connection: ${status}`);
      },
      onRepCountUpdate: (repCount) => {
        toast.success(`Rep count: ${repCount}`);
      },
      onConnectionSuccess: (puckClient) => {
        toast.success(`Connected to Puck for ${machine.name}!`);
        // Navigate to the machine page with active connection
        navigate(`/machine/${machineId}`);
      },
      onConnectionFailed: (error) => {
        toast.error(`Connection failed: ${error}`);
        // Still navigate to show the UI, even without connection
        navigate(`/machine/${machineId}`);
      }
    };

    // Attempt actual BLE connection (simulating the Universal Link flow)
    try {
      const result = await connectNearest(10000, callbacks);
      if (!result.success) {
        console.warn('BLE connection failed, navigating anyway for UI testing');
        navigate(`/machine/${machineId}`);
      }
    } catch (error) {
      console.warn('BLE connection error:', error);
      toast.info('No Puck found - showing test UI');
      navigate(`/machine/${machineId}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>NFC Test Panel</CardTitle>
        <p className="text-sm text-muted-foreground">
          Simulate NFC taps to different machines. This will attempt real BLE connections and show the rep counter interface.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testMachines.map((machine) => (
            <div key={machine.id} className="p-4 border rounded-lg space-y-2">
              <h3 className="font-semibold">{machine.name}</h3>
              <Badge variant="secondary">{machine.muscleGroup}</Badge>
              <p className="text-xs text-muted-foreground font-mono">
                {machine.url}
              </p>
              <Button 
                onClick={() => handleTestMachine(machine.id)}
                size="sm" 
                className="w-full"
              >
                Test NFC → BLE
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Testing:</strong> Click "Test NFC → BLE" to simulate the full flow: NFC tap → Universal Link → BLE scan → Connection → Rep Counter. For real NFC testing, write these URLs to NFC tags using "NFC Tools".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}