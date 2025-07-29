import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { nfcService, type MachineId } from '@/services/nfcService';
import MachineDetailView from '@/components/MachineDetailView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MachineAccess = () => {
  const { machineId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMachine = () => {
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
      setLoading(false);
      
      toast.success(`${machineDetails.machine} loaded via NFC!`);
    };

    initializeMachine();
  }, [machineId]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-primary">
            🏷️ Accessed via NFC Tap - {exercise.machine}
          </AlertDescription>
        </Alert>
      </div>
      
      <MachineDetailView
        exercise={exercise}
        onBack={handleBack}
        onExerciseComplete={handleExerciseComplete}
      />
    </div>
  );
};

export default MachineAccess;