import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MachineScanner } from '@/components/MachineScanner';
import { MachineRegistryService } from '@/services/machineRegistryService';
import { ExerciseTrackingDialog } from '@/components/ExerciseTrackingDialog';
import { isMachineBodyweightCompatible, getMachineExercises } from '@/utils/machineExerciseMapping';
import { toast } from 'sonner';
import { usePageContext } from '@/hooks/usePageContext';

export const ScanMachine: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  // Register page context for chatbot
  usePageContext({
    pageName: 'Scan Machine',
    pageDescription: 'AI-powered gym machine scanner - point camera at equipment for instant recognition',
    visibleContent: 'Use camera to scan any gym machine for automatic identification. AI will recognize the equipment and provide exercise recommendations with proper form guidance.'
  });

  const [pendingNavigation, setPendingNavigation] = useState<{
    machineId: string;
    machineName: string;
    workoutId: string;
    confidence: number;
    aiSelectedImageUrl?: string;
  } | null>(null);

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
      return;
    }

    // Check if machine supports bodyweight exercises (not in custom mode)
    if (isMachineBodyweightCompatible(machineId)) {
      // Store navigation details and show dialog
      setPendingNavigation({
        machineId: machine.id,
        machineName: machine.name,
        workoutId,
        confidence,
        aiSelectedImageUrl: aiSelectedImageUrl || machine.imageUrl
      });
      setShowExerciseDialog(true);
    } else {
      // No bodyweight compatibility, go straight to machine workout
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

  const handleAITrackingSelected = () => {
    if (!pendingNavigation) return;
    
    const exerciseInfo = getMachineExercises(pendingNavigation.machineId);
    if (!exerciseInfo) return;

    // Navigate to live workout with pre-selected exercise
    navigate(`/live-workout?exercise=${exerciseInfo.defaultExercise}&machine=${pendingNavigation.machineId}&source=scan`, {
      state: {
        machineName: pendingNavigation.machineName,
        workoutId: pendingNavigation.workoutId,
        aiSelectedImageUrl: pendingNavigation.aiSelectedImageUrl
      }
    });
    setShowExerciseDialog(false);
  };

  const handleMachineWorkoutSelected = () => {
    if (!pendingNavigation) return;

    // Navigate to machine workout
    navigate(`/machine-workout/${pendingNavigation.workoutId}`, { 
      state: { 
        fromScan: true, 
        confidence: pendingNavigation.confidence,
        machineId: pendingNavigation.machineId,
        machineName: pendingNavigation.machineName,
        aiSelectedImageUrl: pendingNavigation.aiSelectedImageUrl
      }
    });
    setShowExerciseDialog(false);
  };

  const handleClose = () => {
    navigate('/workout-list');
  };

  const exerciseInfo = pendingNavigation ? getMachineExercises(pendingNavigation.machineId) : null;

  return (
    <>
      <MachineScanner
        onMachineSelected={handleMachineSelected}
        onClose={handleClose}
        autoNavigate={true}
      />
      
      {showExerciseDialog && pendingNavigation && exerciseInfo && (
        <ExerciseTrackingDialog
          open={showExerciseDialog}
          onOpenChange={setShowExerciseDialog}
          machineName={pendingNavigation.machineName}
          exercise={exerciseInfo.defaultExercise}
          context={exerciseInfo.context}
          onSelectAITracking={handleAITrackingSelected}
          onSelectMachineWorkout={handleMachineWorkoutSelected}
        />
      )}
    </>
  );
};

export default ScanMachine;