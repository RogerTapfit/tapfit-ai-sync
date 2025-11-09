import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MachineScanner } from '@/components/MachineScanner';
import { MachineRegistryService } from '@/services/machineRegistryService';
import { toast } from 'sonner';

export const ScanMachine: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMachineSelected = async (machineId: string, confidence: number, aiSelectedImageUrl?: string) => {
    // Don't navigate if machine is not recognized
    if (machineId === 'UNKNOWN') {
      toast.error('Machine not recognized. Please try again or select manually.');
      return;
    }

    const machine = MachineRegistryService.getMachineById(machineId);
    const workoutId = MachineRegistryService.getWorkoutIdByMachineId(machineId);

    if (!machine || !workoutId) {
      toast.error('Machine not found');
      navigate('/workout-list');
      return;
    }

    toast.success(`${machine.name} identified! (${Math.round(confidence * 100)}% confidence)`);

    // Check if we're in custom mode
    const workoutMode = (location.state as any)?.workoutMode;
    
    if (workoutMode === 'custom') {
      // In custom mode, return to workout list with machine details
      navigate('/workout-list?mode=custom', { 
        state: { 
          fromScan: true,
          machineId: machine.id,
          machineName: machine.name
        }
      });
    } else {
      // In scheduled mode, navigate to machine workout detail
      navigate(`/machine-workout/${workoutId}`, { 
        state: { 
          fromScan: true, 
          confidence,
          machineId: machine.id,
          machineName: machine.name,
          aiSelectedImageUrl: aiSelectedImageUrl || machine.imageUrl
        }
      });
    }
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