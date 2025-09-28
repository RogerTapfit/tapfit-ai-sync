import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Target, 
  Weight, 
  RotateCcw, 
  Edit3,
  HelpCircle,
  Activity,
  Heart,
  Smartphone
} from "lucide-react";
import { CardioPrescriptionService } from '@/services/cardioPrescriptionService';
import { CardioMachineType, CardioGoal, HeartRateZone, CardioUserProfile } from '@/types/cardio';
import { supabase } from '@/integrations/supabase/client';
import { useWorkoutPlan } from "@/hooks/useWorkoutPlan";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NFCMachinePopup } from "@/components/NFCMachinePopup";
import { blePuckUtil, type ConnectedDevice } from "@/services/blePuckUtil";
import { MobileActionBar } from "@/components/MobileActionBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Capacitor } from "@capacitor/core";
import { useHeartRate } from "@/hooks/useHeartRate";
import { CardioWorkoutSession } from "@/components/CardioWorkoutSession";
interface WorkoutSet {
  id: number;
  reps: number;
  weight: number;
  completed: boolean;
  actualReps?: number;
  actualWeight?: number;
}

const WorkoutDetail = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const location = useLocation();
  const { logExercise, currentWorkoutLog } = useWorkoutLogger();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => 
    localStorage.getItem('developerMode') === 'true'
  );

  // Start Workout flow state
  type Mode = 'idle' | 'inset' | 'rest' | 'done';
  const [mode, setMode] = useState<Mode>('idle');
  const [autoFlowActive, setAutoFlowActive] = useState(false);
  const [setIndexAuto, setSetIndexAuto] = useState(1); // 1..sets.length
  const [reps, setReps] = useState(0); // 0..10

  // Smart Puck BLE
  const [puckDevice, setPuckDevice] = useState<ConnectedDevice | null>(null);
  const [stopNotify, setStopNotify] = useState<null | (() => Promise<void>)>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPuckRepRef = useRef(0);
  // iOS native quick actions support (Apple Watch Live HR)
  const isIOS = Capacitor.getPlatform() === 'ios';
  const { start: startHR } = useHeartRate();
  const handleLiveHR = async () => {
    try {
      toast('Starting Live HR…');
      await startHR('functionalStrengthTraining');
      toast.success('Live HR started');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to start live HR');
    }
  };
  // Developer mode toggle with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        const newMode = !isDeveloperMode;
        setIsDeveloperMode(newMode);
        localStorage.setItem('developerMode', newMode.toString());
        toast.success(`Developer mode ${newMode ? 'enabled' : 'disabled'}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeveloperMode]);

  // Static workout data
  const workoutData: Record<string, any> = {
    "1": {
      name: "Chest Press Machine",
      sets: 4,
      reps: 10,
      weight: "80 lbs",
      restTime: 90,
      image: "/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png",
      primaryMuscle: "Pectoralis Major (Sternal head – mid chest)",
      secondaryMuscles: "Anterior deltoids, triceps brachii",
      notes: "Top end of your suggested range for strength focus"
    },
    "2": {
      name: "Pec Deck (Butterfly) Machine", 
      sets: 4,
      reps: 12,
      weight: "50 lbs",
      restTime: 90,
      image: "/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png",
      primaryMuscle: "Pectoralis Major (Sternal & Clavicular heads – inner & upper chest)",
      secondaryMuscles: "Anterior deltoids, biceps (stabilizers)",
      notes: "Mid-range for hypertrophy, controlled tempo"
    },
    "3": {
      name: "Incline Chest Press Machine",
      sets: 3,
      reps: 10, 
      weight: "60 lbs",
      restTime: 90,
      image: "/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png",
      primaryMuscle: "Pectoralis Major (Clavicular head – upper chest)",
      secondaryMuscles: "Anterior deltoids, triceps brachii",
      notes: "Moderate load, hitting upper chest"
    },
    "4": {
      name: "Decline Chest Press Machine",
      sets: 3,
      reps: "8-10",
      weight: "80 lbs", 
      restTime: 90,
      image: "/lovable-uploads/72acfefe-3a0e-4d74-b92f-ce88b0a38d7e.png",
      primaryMuscle: "Pectoralis Major (Lower/Abdominal head – lower chest)",
      secondaryMuscles: "Triceps brachii, anterior deltoids",
      notes: "Slightly heavier for power-based lower pec work"
    },
    "5": {
      name: "Cable Crossover Machine",
      sets: 4,
      reps: "12-15",
      weight: "20 lbs per side",
      restTime: 75,
      image: "/lovable-uploads/ee18485a-269f-4a98-abe3-54fab538f201.png",
      primaryMuscle: "Pectoralis Major (focus varies depending on angle: high-to-low = lower chest, low-to-high = upper chest)",
      secondaryMuscles: "Anterior deltoids, serratus anterior, biceps (stabilizers)",
      notes: "Isolation movement, moderate to high reps"
    },
    "6": {
      name: "Smith Machine (Flat Bench Press setup)",
      sets: 4,
      reps: "8-10", 
      weight: "85 lbs (bar + plates)",
      restTime: 120,
      image: "/lovable-uploads/55d72a0c-1e5a-4d6f-abfa-edfe80701063.png",
      primaryMuscle: "Pectoralis Major (Sternal head – mid chest)",
      secondaryMuscles: "Anterior deltoids, triceps brachii",
      notes: "Includes bar weight + plates"
    },
    "7": {
      name: "Seated Dip Machine (Chest-focused variant)",
      sets: 3,
      reps: 12,
      weight: "100 lbs",
      restTime: 90,
      image: "/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png",
      primaryMuscle: "Pectoralis Major (Lower portion)",
      secondaryMuscles: "Triceps brachii, anterior deltoids",
      notes: "Compound press targeting lower chest and triceps"
    },
    "8": {
      name: "Assisted Chest Dips Machine",
      sets: 3,
      reps: 10,
      weight: "70 lbs assist", 
      restTime: 90,
      image: "/lovable-uploads/0d9b2a95-f255-4a68-a040-7998a9ffb1cf.png",
      primaryMuscle: "Pectoralis Major (Lower chest)",
      secondaryMuscles: "Triceps brachii, anterior deltoids, rhomboids (minor stabilizing)",
      notes: "Medium assistance for controlled negative phase"
    }
  };

  const [workout, setWorkout] = useState<any>(null);

  // Use machine data from navigation state if available, fallback to static data
  const machineData = location.state?.machineData;

  // Load workout data
  useEffect(() => {
    const loadWorkout = async () => {
      if (machineData) {
        setLoading(true);
        try {
          const generatedWorkout = await generateWorkoutFromMachine(machineData);
          setWorkout(generatedWorkout);
        } catch (error) {
          console.error('Error loading workout:', error);
          // Fallback to basic workout
          setWorkout({
            name: machineData.name,
            sets: 1,
            reps: 30,
            weight: "Moderate intensity",
            restTime: 0,
            image: machineData.imageUrl,
            primaryMuscle: "Cardiovascular System",
            secondaryMuscles: "Full body endurance",
            notes: "Duration-based cardio workout",
            target: "Zone 2",
            isCardio: true
          });
        } finally {
          setLoading(false);
        }
      } else {
        setWorkout(workoutData[workoutId || "1"]);
      }
    };

    loadWorkout();
  }, [machineData, workoutId]);

  // Generate workout parameters based on machine type
  async function generateWorkoutFromMachine(machine: any) {
    const isCardio = machine.muscleGroup === 'cardio';
    
    if (isCardio) {
      try {
        // Get user profile for personalized prescription
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: profile } = await supabase
          .from('profiles')
          .select('weight_kg, height_cm, age, gender, hr_rest, hr_max, experience_level')
          .eq('id', user.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        // Create user profile for cardio prescription
        const userProfile: CardioUserProfile = {
          weight_kg: profile.weight_kg || 70,
          age: profile.age || 30,
          sex: profile.gender === 'female' ? 'female' : 'male',
          HR_rest: profile.hr_rest || 60,
          HR_max: profile.hr_max || (208 - (0.7 * (profile.age || 30)))
        };

        // Determine fitness level for prescription
        const fitnessLevel = profile.experience_level === 'advanced' ? 'advanced' : 
                            profile.experience_level === 'intermediate' ? 'intermediate' : 'beginner';

        // Determine machine type
        const machineType: CardioMachineType = 
          machine.name.toLowerCase().includes('treadmill') ? 'treadmill' :
          machine.name.toLowerCase().includes('bike') ? 'bike' :
          machine.name.toLowerCase().includes('stair') ? 'stair_stepper' :
          machine.name.toLowerCase().includes('elliptical') ? 'elliptical' :
          machine.name.toLowerCase().includes('row') ? 'rower' : 'treadmill';

        // Get quick prescription based on fitness level
        const quickPrescription = CardioPrescriptionService.getQuickPrescription(
          machineType, 
          fitnessLevel,
          30 // 30 minute default duration
        );

        // Generate full prescription
        const prescription = CardioPrescriptionService.generatePrescription(
          machineType,
          quickPrescription.goal,
          quickPrescription.targetLoad,
          quickPrescription.targetZone,
          userProfile,
          30 // 30 minutes
        );

        // Calculate target HR range from the main workout blocks
        const workoutBlocks = prescription.blocks.filter(b => b.block_type === 'work');
        const avgHrrMin = workoutBlocks.reduce((sum, b) => sum + b.target_hrr_min, 0) / workoutBlocks.length;
        const avgHrrMax = workoutBlocks.reduce((sum, b) => sum + b.target_hrr_max, 0) / workoutBlocks.length;

        // Format prescription for UI
        const machineSettingsText = formatMachineSettings(machineType, prescription.initial_settings);
        const targetZoneText = formatTargetZone(quickPrescription.targetZone, { min: avgHrrMin, max: avgHrrMax });

        return {
          name: machine.name,
          sets: 1, // We'll show this as "Blocks" in the UI
          reps: prescription.total_duration, // Duration in minutes
          weight: machineSettingsText, // Machine settings (speed, incline, etc.)
          restTime: 0, // No rest between cardio blocks
          image: machine.imageUrl || "/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png",
          primaryMuscle: "Cardiovascular System",
          secondaryMuscles: `${prescription.estimated_calories} calories • ${quickPrescription.goal.toUpperCase()} training`,
          notes: `${prescription.blocks.length} workout phases: ${prescription.blocks.map(b => `${b.block_type} (${b.duration_min}min)`).join(', ')}`,
          target: targetZoneText,
          isCardio: true,
          machineType,
          prescription // Store full prescription for detailed display
        };
      } catch (error) {
        console.error('Error generating cardio prescription:', error);
        // Fallback to basic cardio workout
        return {
          name: machine.name,
          sets: 1,
          reps: 30, // 30 minutes
          weight: "Moderate intensity",
          restTime: 0,
          image: machine.imageUrl || "/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png",
          primaryMuscle: "Cardiovascular System",
          secondaryMuscles: "Full body endurance workout",
          notes: "Duration-based cardio workout",
          target: "Zone 2 (60-70% effort)",
          isCardio: true,
          machineType: machine.name.toLowerCase().includes('treadmill') ? 'treadmill' : 'bike'
        };
      }
    } else {
      // Strength training defaults
      return {
        name: machine.name,
        sets: 3,
        reps: 10,
        weight: "60 lbs",
        restTime: 90,
        image: machine.imageUrl || "/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png",
        primaryMuscle: `${machine.muscleGroup.charAt(0).toUpperCase() + machine.muscleGroup.slice(1)} muscles`,
        secondaryMuscles: "Supporting stabilizer muscles",
        notes: `Standard strength training for ${machine.muscleGroup}`,
        target: machine.muscleGroup.charAt(0).toUpperCase() + machine.muscleGroup.slice(1),
        isCardio: false
      };
    }
  }

  // Helper functions for formatting cardio data
  function formatMachineSettings(machineType: CardioMachineType, settings: any): string {
    switch (machineType) {
      case 'treadmill':
        return `${settings.speed_kmh || 5.5} km/h, ${settings.incline_pct || 2}% incline`;
      case 'bike':
        return `${settings.watts || 100}W, Level ${settings.resistance_level || 5}`;
      case 'elliptical':
        return `Level ${settings.resistance_level || 8}`;
      case 'stair_stepper':
        return `${settings.steps_per_min || 80} steps/min, Level ${settings.level || 6}`;
      case 'rower':
        return `${settings.stroke_rate || 24} strokes/min, Level ${settings.resistance || 5}`;
      default:
        return "Moderate intensity";
    }
  }

  function formatTargetZone(zone: HeartRateZone, hrrRange?: { min: number; max: number }): string {
    const zoneNames = {
      'Z1': 'Recovery Zone',
      'Z2': 'Aerobic Base', 
      'Z3': 'Aerobic Threshold',
      'Z4': 'Anaerobic Threshold',
      'Z5': 'Neuromuscular Power',
      'Z2-Z3': 'Endurance Zone',
      'Z3-Z4': 'Tempo Zone'
    };
    
    const zoneName = zoneNames[zone] || zone;
    if (hrrRange) {
      return `${zoneName} (${Math.round(hrrRange.min)}-${Math.round(hrrRange.max)}% effort)`;
    }
    return zoneName;
  }

  useEffect(() => {
    if (workout) {
      initializeSets();
    }
  }, [workout, workoutId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      // Play countdown beeps at 10, 5, 4, 3, 2, 1 seconds
      if ([10, 5, 4, 3, 2, 1].includes(restTime)) {
        import('@/utils/audioUtils').then(({ audioManager }) => {
          audioManager.playCountdownBeep();
        });
      }

      timer = setTimeout(() => {
        setRestTime(restTime - 1);
      }, 1000);
    } else if (isResting && restTime === 0) {
      setIsResting(false);
      // Play rest complete sound
      import('@/utils/audioUtils').then(async ({ audioManager }) => {
        await audioManager.playRestComplete();
      });

      if (autoFlowActive) {
        if (setIndexAuto < sets.length) {
          // Advance to next set
          setMode('inset');
          setSetIndexAuto(prev => prev + 1);
          setReps(0);
        } else {
          // Finalize workout after last rest
          (async () => {
            const { audioManager } = await import('@/utils/audioUtils');
            await audioManager.playWorkoutComplete();
            setMode('done');
            setAutoFlowActive(false);
            await completeWorkout();
          })();
        }
      } else {
        toast.success("Rest time complete! Ready for next set");
      }
    }
    return () => clearTimeout(timer);
  }, [isResting, restTime, autoFlowActive, setIndexAuto, sets.length]);

  const initializeSets = () => {
    if (!workout) return;
    
    // Extract numeric weight from the workout weight string
    const extractWeight = (weightStr: string | undefined): number => {
      if (!weightStr || typeof weightStr !== 'string') return 0;
      const match = weightStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const defaultWeight = extractWeight(workout.weight);
    
    const newSets: WorkoutSet[] = [];
    for (let i = 0; i < workout.sets; i++) {
      newSets.push({
        id: i + 1,
        reps: typeof workout.reps === 'string' ? parseInt(workout.reps.split('-')[0]) : workout.reps,
        weight: 0,
        completed: false,
        actualReps: typeof workout.reps === 'string' ? parseInt(workout.reps.split('-')[0]) : workout.reps,
        actualWeight: defaultWeight
      });
    }
    setSets(newSets);
  };

  // Automated Start Workout flow
  const MAX_REPS = 10;
  const SERVICE = 'FFE0';
  const CHAR = 'FFE1';

  const resetPuckCounter = async () => {
    lastPuckRepRef.current = 0;
    await blePuckUtil.writeSafe(puckDevice?.deviceId, SERVICE, CHAR, new Uint8Array([0x00]));
  };

  const onBleNotify = (buf: ArrayBuffer) => {
    try {
      const u = new Uint8Array(buf);
      if (u.length === 0) return;
      // Preferred: absolute rep count payload [0x01, repCount]
      if (u[0] === 0x01) {
        const target = Math.min(u[1] ?? 0, MAX_REPS);
        if (target > lastPuckRepRef.current) {
          const delta = target - lastPuckRepRef.current;
          lastPuckRepRef.current = target;
          for (let i = 0; i < delta; i++) onRep();
        }
        return;
      }
      // Fallbacks: various single-byte or JSON formats
      if (u.length === 1 && u[0] > 0 && u[0] <= MAX_REPS) {
        onRep();
        return;
      }
      try {
        const str = new TextDecoder().decode(u);
        if (str.includes('"rep"') || str.includes('"type":"rep"')) {
          onRep();
        }
      } catch {}
    } catch {}
  };

  const connectPuck = async () => {
    try {
      const dev = await blePuckUtil.connectFirst({
        service: SERVICE,
        onDisconnect: () => {
          setIsReconnecting(true);
          if (reconnectTimerRef.current) return;
          reconnectTimerRef.current = setTimeout(async () => {
            reconnectTimerRef.current = null;
            try {
              await connectPuck();
              setIsReconnecting(false);
            } catch (e) {
              console.warn('Puck reconnect failed', e);
              // try again in 2s
              if (!reconnectTimerRef.current) {
                reconnectTimerRef.current = setTimeout(async () => {
                  reconnectTimerRef.current = null;
                  try { await connectPuck(); setIsReconnecting(false); } catch {}
                }, 2000);
              }
            }
          }, 1500);
        },
      });
      setPuckDevice(dev);
      const stop = await blePuckUtil.subscribe(dev.deviceId, SERVICE, CHAR, onBleNotify);
      setStopNotify(() => stop);
      await resetPuckCounter();
    } catch (e) {
      console.warn('Puck connect failed', e);
    }
  };

  const startWorkout = async () => {
    setAutoFlowActive(true);
    setMode('inset');
    setSetIndexAuto(1);
    setReps(0);
    connectPuck(); // fire-and-forget BLE connection
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playButtonClick();
  };

  // Auto-connect from deep links (?autoConnect=puck)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('autoConnect') === 'puck' && mode === 'idle') {
      startWorkout();
    }
  }, [location.search, mode]);

  const onRep = async () => {
    if (mode !== 'inset') return;
    const next = Math.min(reps + 1, MAX_REPS);
    setReps(next);
    // Reflect current reps in the active set row
    setSets(prev => prev.map(s => s.id === setIndexAuto ? { ...s, actualReps: next } : s));
    if (next === MAX_REPS) {
      const { audioManager } = await import('@/utils/audioUtils');
      await audioManager.playSetComplete();
      // Mark set complete and start rest
      await handleSetComplete(setIndexAuto - 1);
      setMode('rest');
    }
  };

  const handleSetComplete = async (setIndex: number) => {
    // Clear any active rest timer if user continues early
    if (isResting) {
      setIsResting(false);
      setRestTime(0);
    }

    const updatedSets = [...sets];
    updatedSets[setIndex].completed = true;
    setSets(updatedSets);

    // Play set completion sound (custom or default)
    const { audioManager } = await import('@/utils/audioUtils');
    const customSounds = JSON.parse(localStorage.getItem('customSounds') || '{}');
    if (customSounds['set-complete']) {
      await audioManager.playCustomSound(customSounds['set-complete'], 'set-complete', 
        () => audioManager.playSetComplete());
    } else {
      await audioManager.playSetComplete();
    }
    
    // Check for progress milestones
    const newCompletedSets = updatedSets.filter(set => set.completed).length;
    const newProgress = (newCompletedSets / totalSets) * 100;
    
    if (newProgress === 25 || newProgress === 50 || newProgress === 75) {
      setTimeout(async () => {
        await audioManager.playProgressMilestone(newProgress);
      }, 200);
    } else if (newProgress === 100) {
      setTimeout(async () => {
        await audioManager.playWorkoutComplete();
      }, 300);
    }

    // Start rest timer
    setRestTime(workout.restTime);
    setIsResting(true);
    // Reset puck counter during rest
    resetPuckCounter();

    toast.success(`Set ${setIndex + 1} completed!`);
  };

  const handleSetEdit = (setIndex: number, field: 'actualReps' | 'actualWeight', value: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex][field] = value;
    setSets(updatedSets);
  };

  const saveProgress = async () => {
    if (!currentWorkoutLog || !workout) return;

    const totalReps = sets.reduce((sum, set) => sum + (set.actualReps || 0), 0);
    const completedSets = sets.filter(s => s.completed).length;
    
    if (completedSets > 0) {
      await logExercise(
        currentWorkoutLog.id,
        workout.name,
        workout.name,
        completedSets,
        totalReps,
        sets[0]?.actualWeight
      );
    }
  };

  const completeWorkout = async () => {
    await saveProgress();
    toast.success('Exercise completed!');
    // Auto-navigate back to workout list
    navigate('/workout-list', { state: { fromWorkoutDetail: true } });
  };

  const handleBackToList = async () => {
    await saveProgress();
    navigate('/workout-list', { state: { fromWorkoutDetail: true } });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !workout) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p>Loading workout...</p>
        </div>
      </div>
    );
  }

  const completedSets = sets.filter(s => s.completed).length;
  const totalSets = sets.length;
  const exerciseProgress = (completedSets / totalSets) * 100;

  // Dynamic progress bar gradient color based on percentage
  const getProgressGradient = (percentage: number) => {
    // Create a smooth gradient from red (0%) to yellow (50%) to green (100%)
    if (percentage <= 50) {
      // Red to Yellow transition (0% to 50%)
      const ratio = percentage / 50;
      const red = 255;
      const green = Math.round(255 * ratio);
      const blue = 0;
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Yellow to Green transition (50% to 100%)
      const ratio = (percentage - 50) / 50;
      const red = Math.round(255 * (1 - ratio));
      const green = 255;
      const blue = 0;
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  // Auto-complete when all sets are done (disabled during automated flow)
  useEffect(() => {
    if (autoFlowActive) return;
    if (completedSets === totalSets && totalSets > 0) {
      const timer = setTimeout(() => {
        completeWorkout();
      }, 2000); // 2 second delay to show completion
      return () => clearTimeout(timer);
    }
  }, [completedSets, totalSets, autoFlowActive]);

  // Cleanup BLE on unmount
  useEffect(() => {
    return () => {
      try { stopNotify?.(); } catch {}
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
      blePuckUtil.disconnect(puckDevice?.deviceId);
    };
  }, [stopNotify, puckDevice?.deviceId]);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
          <span className="ml-2">Generating personalized cardio workout...</span>
        </div>
      )}

      {/* Content - only show when not loading and workout is available */}
      {!loading && workout && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={async () => {
            console.log('Back button clicked');
            console.log('Current URL:', window.location.href);
            console.log('History length:', window.history.length);
            
            const { audioManager } = await import('@/utils/audioUtils');
            await audioManager.playButtonClick();
            
            try {
              navigate(-1);
              console.log('navigate(-1) called');
            } catch (error) {
              console.error('Navigation error:', error);
              navigate('/');
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <p className="text-muted-foreground">
            Chest Workout • {workout.sets} sets × {workout.reps} reps
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDeveloperMode && workoutId && (
            <NFCMachinePopup machineId={workoutId} machineName={workout.name}>
              <Button variant="outline" size="sm" className="text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                NFC
              </Button>
            </NFCMachinePopup>
          )}
          <Badge variant="outline">
            Chest
          </Badge>
        </div>
      </div>

      {/* iOS native Quick Actions */}
      {isIOS && (
        <div className="md:hidden sticky top-0 z-30 -mx-4 px-4 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/70">
          <div className="py-3 flex items-center justify-between gap-2">
            <Button onClick={startWorkout} className="flex-1">
              <Activity className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button variant="outline" onClick={onRep} className="flex-1">
              <Target className="h-4 w-4 mr-2" />
              Rep Test
            </Button>
            <Button variant="secondary" onClick={handleLiveHR} className="flex-1">
              <Heart className="h-4 w-4 mr-2" />
              Live HR
            </Button>
          </div>
        </div>
      )}

      {isReconnecting && (
        <div className="w-full text-center text-amber-600 text-sm">Puck disconnected – reconnecting…</div>
      )}

      {/* Exercise Progress */}
      <Card className="glow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Exercise Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedSets} of {totalSets} sets completed
            </p>
          </div>
          <div className="text-right">
            <div 
              className="text-2xl font-bold transition-colors duration-500"
              style={{
                color: getProgressGradient(exerciseProgress)
              }}
            >
              {Math.round(exerciseProgress)}%
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="w-full bg-secondary rounded-full h-3"></div>
          <div 
            className="absolute inset-0 h-3 rounded-full transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, 
                rgb(239, 68, 68) 0%, 
                rgb(251, 191, 36) 50%, 
                rgb(34, 197, 94) 100%)`,
              width: `${exerciseProgress}%`,
              clipPath: 'inset(0 0 0 0)'
            }}
          />
        </div>
      </Card>

      {/* Rest Timer - Non-blocking */}
      {isResting && (
        <div className="fixed top-4 right-4 z-50 w-64">
          <Card className="bg-background/95 backdrop-blur border-muted">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Suggested Rest</span>
              </div>
              <div className="text-2xl font-bold text-primary mb-3">
                {formatTime(restTime)}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => {
                    setIsResting(false);
                    setRestTime(0);
                  }}
                  className="flex-1"
                >
                  Continue
                </Button>
                <Button 
                  size="sm"
                  variant="ghost" 
                  onClick={() => {
                    setIsResting(false);
                    setRestTime(0);
                  }}
                >
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Machine Image and Muscle Groups */}
      {workout.image && (
        <Card className="glow-card p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <img 
                src={workout.image} 
                alt={workout.name}
                className="w-full h-64 object-contain rounded-lg bg-secondary/50"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">Primary Muscle</h4>
                <p className="text-sm">{workout.primaryMuscle}</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Secondary Muscles</h4>
                <p className="text-sm">{workout.secondaryMuscles}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Exercise Details */}
      <Card className="glow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Exercise Details</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.isCardio ? workout.sets : workout.sets}</div>
            <div className="text-sm text-muted-foreground">{workout.isCardio ? "Blocks" : "Sets"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.reps}</div>
            <div className="text-sm text-muted-foreground">{workout.isCardio ? "Minutes" : "Reps"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.isCardio ? "N/A" : formatTime(workout.restTime)}</div>
            <div className="text-sm text-muted-foreground">{workout.isCardio ? "Continuous" : "Rest"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.target || (workout.isCardio ? "Cardio" : "Chest")}</div>
            <div className="text-sm text-muted-foreground">Target</div>
          </div>
        </div>
        
        <div className="bg-background/50 p-3 rounded-lg space-y-2">
          <p className="text-sm">
            <strong>{workout.isCardio ? "Machine Settings:" : "Starting Weight:"}</strong> {workout.weight}
          </p>
          {workout.notes && (
            <p className="text-sm">
              <strong>{workout.isCardio ? "Workout Structure:" : "Training Notes:"}</strong> {workout.notes}
            </p>
          )}
        </div>
      </Card>

      {/* Sets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sets</h3>
          <Button id="start-workout" onClick={startWorkout} disabled={mode !== 'idle'}>
            Start Workout
          </Button>
        </div>
        {sets.map((set, index) => (
          <Card 
            key={set.id} 
            className={`glow-card p-4 ${set.completed ? 'border-green-500 bg-green-500/5' : ''}`}
          >
            <div className="space-y-4">
                {/* Set header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      id="rep-test"
                      aria-label="Rep Test"
                      size="icon"
                      variant="outline"
                      onClick={onRep}
                      disabled={mode !== 'inset' || isResting || set.id !== setIndexAuto}
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                    <div
                      className="px-3 py-1 rounded-full bg-secondary text-foreground text-sm font-semibold"
                      data-testid="rep-counter"
                    >
                      {mode === 'inset' && set.id === setIndexAuto ? reps : 0}
                    </div>
                    <div className="text-lg font-semibold">Set {set.id}</div>
                  </div>
                  {set.completed && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              
              {/* Inputs and button - responsive layout */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Input fields */}
                <div className="flex gap-4 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      type="number"
                      value={set.actualReps}
                      onChange={(e) => handleSetEdit(index, 'actualReps', parseInt(e.target.value) || 0)}
                      className="w-full h-10"
                      disabled={set.completed || (autoFlowActive && set.id === setIndexAuto)}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">reps</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Weight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      type="number"
                      value={set.actualWeight}
                      onChange={(e) => handleSetEdit(index, 'actualWeight', parseInt(e.target.value) || 0)}
                      className="w-full h-10"
                      disabled={set.completed || (autoFlowActive && set.id === setIndexAuto)}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">lbs</span>
                  </div>
                </div>
                
                {/* Complete button */}
                {!set.completed && (
                  <Button
                    onClick={() => handleSetComplete(index)}
                    disabled={autoFlowActive}
                    className="w-full sm:w-auto sm:min-w-[120px] h-10"
                  >
                      Complete Set
                    </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <Card className="glow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Edit3 className="h-4 w-4" />
          <label className="text-sm font-medium">Exercise Notes</label>
        </div>
        <Textarea
          placeholder="How did this exercise feel? Any observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-20"
        />
      </Card>

      {/* Help */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <HelpCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Tips</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Proper Form</h4>
              <p className="text-sm text-muted-foreground">
                Focus on controlled movements and full range of motion. Quality over quantity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Weight Selection</h4>
              <p className="text-sm text-muted-foreground">
                Choose a weight that allows you to complete all reps with good form while feeling challenged on the last 2-3 reps.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rest Periods</h4>
              <p className="text-sm text-muted-foreground">
                Rest periods are optimized for your goals. For strength: 2-3 mins, for hypertrophy: 1-2 mins.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={handleBackToList}
          className="h-12"
        >
          Back to List
        </Button>
        
        {completedSets === totalSets ? (
          <Button 
            onClick={completeWorkout}
            className="h-12"
            disabled={loading}
          >
            Complete Workout
          </Button>
        ) : (
          <Button 
            variant="outline"
            disabled
            className="h-12"
          >
            Complete all sets to continue
          </Button>
        )}
      </div>

      {/* Spacer for sticky action bar on mobile */}
      <div className="h-24 md:hidden" />

      {/* Mobile sticky action bar */}
      <MobileActionBar
        canStart={mode === 'idle'}
        canRep={mode === 'inset' && !isResting}
        onStart={startWorkout}
        onRep={onRep}
      />
      </>
      )}
    </div>
  );
};

export default WorkoutDetail;