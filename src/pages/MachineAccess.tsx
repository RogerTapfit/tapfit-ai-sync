import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { nfcService, type MachineId } from '@/services/nfcService';
import { bleService } from '@/services/bleService';
import MachineDetailView from '@/components/MachineDetailView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Bluetooth, Nfc } from 'lucide-react';
import { toast } from 'sonner';

const MachineAccess = () => {
  const { machineId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectingBLE, setIsConnectingBLE] = useState(false);
  const [bleConnected, setBleConnected] = useState(false);
  
  // Check for auto-connect parameter
  const shouldAutoConnect = searchParams.get('autoConnect') === 'puck';

  useEffect(() => {
    const initializeMachine = async () => {
      if (!machineId) {
        setError('No machine ID provided');
        setLoading(false);
        return;
      }

      if (!nfcService.isValidMachineId(machineId)) {
        setError('Invalid machine ID');
        setLoading(false);
        return;
      }

      try {
        const machineDetails = nfcService.getMachineDetails(machineId as MachineId);
        
        // Create exercise object compatible with MachineDetailView
        const exerciseData = {
          machine: machineDetails.machine,
          sets: machineDetails.defaultSets,
          reps: machineDetails.defaultReps,
          rest_seconds: machineDetails.restSeconds,
          weight_guidance: 'Adjust weight based on your strength level',
          order: 1,
          exercise_type: machineDetails.exerciseType,
          muscle_group: machineDetails.muscleGroup
        };

        setExercise(exerciseData);
        
        // Auto-initiate BLE connection for this machine
        await initiateBLEConnection(machineId as MachineId);
        
        toast.success(`${machineDetails.machine} loaded via NFC!`);
      } catch (error) {
        console.error('Error initializing machine:', error);
        setError('Failed to initialize machine');
      } finally {
        setLoading(false);
      }
    };

    initializeMachine();
  }, [machineId]);

  // Initialize BLE connection for machine-specific Puck.js
  const initiateBLEConnection = async (machineId: MachineId) => {
    setIsConnectingBLE(true);
    
    try {
      console.log(`Initiating BLE connection for machine: ${machineId}`);
      
      // Request BLE permissions first
      const hasPermissions = await bleService.requestPermissions();
      if (!hasPermissions) {
        toast.error("Please enable Bluetooth to connect to the Puck.js sensor");
        return;
      }

      // Connect to machine-specific device
      await bleService.connectToMachineDevice(machineId);
      
      toast.info(`Looking for ${machineId}-puck device...`);

      // Listen for connection status changes
      const unsubscribe = bleService.onStatusChange((status) => {
        if (status.isConnected) {
          setBleConnected(true);
          toast.success(`Puck.js Connected: ${status.deviceName}`);
          unsubscribe();
        }
      });

      // Stop connecting after 30 seconds if no device found
      setTimeout(() => {
        if (!bleConnected) {
          setIsConnectingBLE(false);
          toast.warning("Puck.js not found - using manual tracking");
        }
      }, 30000);

    } catch (error) {
      console.error("Failed to connect to BLE device:", error);
      toast.error("Could not connect to Puck.js sensor");
    } finally {
      setIsConnectingBLE(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleExerciseComplete = () => {
    toast.success('Exercise completed!');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading machine...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Machine Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}. The machine you're trying to access may not be available or the NFC tag may be incorrectly configured.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exercise) {
    return null;
  }

  // Connection status component
  const ConnectionStatusCard = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Nfc className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">NFC Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <Bluetooth className={`h-5 w-5 ${bleConnected ? 'text-green-500' : isConnectingBLE ? 'text-yellow-500' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${bleConnected ? 'text-green-600' : isConnectingBLE ? 'text-yellow-600' : 'text-gray-500'}`}>
              {bleConnected ? 'Puck.js Connected' : isConnectingBLE ? 'Connecting...' : 'Puck.js Disconnected'}
            </span>
          </div>
        </div>
        {!bleConnected && !isConnectingBLE && (
          <Alert className="mt-3">
            <AlertDescription className="text-xs">
              Manual rep tracking active. Ensure your Puck.js device is named "{machineId}-puck" for auto-connection.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-primary">
            🏷️ Accessed via NFC Tap - {exercise.machine}
          </AlertDescription>
        </Alert>
      </div>
      
      <ConnectionStatusCard />
      
      <MachineDetailView
        exercise={exercise}
        onBack={handleBack}
        onExerciseComplete={handleExerciseComplete}
        autoConnect={true}
      />
    </div>
  );
};

export default MachineAccess;