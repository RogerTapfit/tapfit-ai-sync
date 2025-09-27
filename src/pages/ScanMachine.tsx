import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MachineScanner } from '@/components/MachineScanner';
import { MachineRegistryService } from '@/services/machineRegistryService';
import { toast } from 'sonner';

export const ScanMachine: React.FC = () => {
  const navigate = useNavigate();

  const handleMachineSelected = async (machineId: string, confidence: number) => {
    const machine = MachineRegistryService.getMachineById(machineId);
    const workoutId = MachineRegistryService.getWorkoutIdByMachineId(machineId);

    if (!machine || !workoutId) {
      toast.error('Machine not found');
      navigate('/workout-list');
      return;
    }

    // Check if machine is already in today's workout plan
    // For now, we'll just navigate to the machine detail
    // In production, this would check against the actual workout plan

    toast.success(`${machine.name} identified! (${Math.round(confidence * 100)}% confidence)`);

    // Navigate to machine workout detail
    // Using the workoutId from the machine registry
    navigate(`/machine-workout/${workoutId}`, { 
      state: { 
        fromScan: true, 
        confidence,
        machineId: machine.id,
        machineName: machine.name
      }
    });
  };

  const handleClose = () => {
    navigate('/workout-list');
  };

  return (
    <MachineScanner
      onMachineSelected={handleMachineSelected}
      onClose={handleClose}
      autoNavigate={true}
    />
  );
};

export default ScanMachine;