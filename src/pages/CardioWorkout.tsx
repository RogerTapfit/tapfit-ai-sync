import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CardioWorkoutSession } from '@/components/CardioWorkoutSession';
import { CardioMachineType } from '@/types/cardio';

const CardioWorkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workoutId } = useParams();

  // Get machine data from navigation state
  const machineData = location.state?.machineData;

  if (!machineData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Machine data not found</p>
            <Button onClick={() => navigate('/workout-list')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workouts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine machine type from machine name
  const getMachineType = (machineName: string): CardioMachineType => {
    const name = machineName.toLowerCase();
    if (name.includes('treadmill')) return 'treadmill';
    if (name.includes('bike') || name.includes('cycle')) return 'bike';
    if (name.includes('stair') || name.includes('stepper')) return 'stair_stepper';
    if (name.includes('elliptical')) return 'elliptical';
    if (name.includes('row')) return 'rower';
    return 'treadmill'; // Default fallback
  };

  const machineType = getMachineType(machineData.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/workout-list')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{machineData.name}</h1>
            <p className="text-gray-600">Intelligent cardio workout with real-time adaptation</p>
          </div>
        </div>

        <CardioWorkoutSession 
          machineType={machineType}
          goal="endurance"
          targetZone="Z2"
          duration={30} // Default 30 minutes
          onComplete={() => navigate('/workout-list')}
        />
      </div>
    </div>
  );
};

export default CardioWorkout;