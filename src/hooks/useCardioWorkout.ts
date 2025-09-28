import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHeartRate } from '@/hooks/useHeartRate';
import { 
  CardioSession, 
  CardioBlock, 
  WorkoutPrescription, 
  CardioUserProfile,
  SessionRecording,
  HeartRateTarget,
  calculateHRR
} from '@/types/cardio';
import { CardioPrescriptionService } from '@/services/cardioPrescriptionService';
import { CardioEngineService } from '@/services/cardioEngineService';
import { toast } from '@/hooks/use-toast';

export function useCardioWorkout() {
  const [currentSession, setCurrentSession] = useState<CardioSession | null>(null);
  const [currentBlocks, setCurrentBlocks] = useState<CardioBlock[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [blockElapsedTime, setBlockElapsedTime] = useState(0);
  const [hrData, setHrData] = useState<{ bpm: number; hrr: number; timestamp: number }[]>([]);
  const [machineSettings, setMachineSettings] = useState<any>({});
  const [userProfile, setUserProfile] = useState<CardioUserProfile | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [shouldAdjustIntensity, setShouldAdjustIntensity] = useState(false);

  const { bpm, start: startHR, stop: stopHR, connected } = useHeartRate();

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Timer for session and block tracking
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const totalElapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      setElapsedTime(totalElapsed);

      // Calculate block elapsed time
      let blockStart = 0;
      for (let i = 0; i < activeBlockIndex; i++) {
        blockStart += currentBlocks[i]?.duration_min * 60 || 0;
      }
      const blockElapsed = Math.max(0, totalElapsed - blockStart);
      setBlockElapsedTime(blockElapsed);

      // Check if current block is complete
      const currentBlock = currentBlocks[activeBlockIndex];
      if (currentBlock && blockElapsed >= currentBlock.duration_min * 60) {
        if (activeBlockIndex < currentBlocks.length - 1) {
          setActiveBlockIndex(prev => prev + 1);
          toast({
            title: "Block Complete",
            description: `Moving to ${currentBlocks[activeBlockIndex + 1]?.block_type} phase`,
          });
        } else {
          // Session complete
          completeSession();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive, sessionStartTime, activeBlockIndex, currentBlocks]);

  // Heart rate monitoring and adaptive control
  useEffect(() => {
    if (!bpm || !isSessionActive || !userProfile) return;

    const currentBlock = currentBlocks[activeBlockIndex];
    if (!currentBlock) return;

    const hrr = calculateHRR(bpm, userProfile.HR_rest, userProfile.HR_max);
    const timestamp = elapsedTime;

    // Store HR data
    setHrData(prev => [...prev.slice(-300), { bpm, hrr, timestamp }]); // Keep last 5 minutes

    // Check if adjustment needed
    const targetHRR = (currentBlock.target_hrr_min + currentBlock.target_hrr_max) / 2;
    const hrrDiff = Math.abs(hrr - targetHRR);

    if (hrrDiff > 0.03) { // 3% threshold
      setShouldAdjustIntensity(true);
      
      // Auto-adjust if enabled
      if (currentSession?.machine_type) {
        const newSettings = CardioEngineService.getMachineAdjustment(
          currentSession.machine_type,
          hrr,
          targetHRR,
          machineSettings
        );
        setMachineSettings(newSettings);
        
        toast({
          title: hrr > targetHRR ? "Intensity Decreased" : "Intensity Increased",
          description: getAdjustmentMessage(currentSession.machine_type, newSettings),
          duration: 3000,
        });
      }
    } else {
      setShouldAdjustIntensity(false);
    }

    // Safety checks
    if (hrr > 0.95) {
      toast({
        title: "Heart Rate Too High",
        description: "Reducing intensity for safety",
        variant: "destructive",
      });
      // Emergency reduction
      const safeSettings = CardioEngineService.getMachineAdjustment(
        currentSession!.machine_type,
        hrr,
        0.85, // Target 85% HRR
        machineSettings
      );
      setMachineSettings(safeSettings);
    }

    // Log HR data to database
    logHeartRateData(bpm, hrr, targetHRR);
  }, [bpm, isSessionActive, activeBlockIndex, elapsedTime]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('age, gender, weight_kg, hr_rest, hr_max, ftp_watts, vo2max_velocity')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile({
          age: profile.age || 30,
          sex: profile.gender === 'female' ? 'female' : 'male',
          weight_kg: profile.weight_kg || 70,
          HR_rest: profile.hr_rest || 60,
          HR_max: profile.hr_max || Math.round(208 - 0.7 * (profile.age || 30)),
          FTP_w: profile.ftp_watts,
          vVO2max: profile.vo2max_velocity
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const createSession = async (prescription: WorkoutPrescription): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('cardio_sessions')
        .insert({
          user_id: user.id,
          machine_type: prescription.machine_type,
          goal: prescription.blocks[0]?.block_type === 'work' ? 'endurance' : 'recovery',
          target_load: prescription.target_trimp,
          target_zone: 'Z2',
          planned_duration: prescription.total_duration,
          status: 'planned'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create blocks
      const blocksWithSessionId = prescription.blocks.map(block => ({
        session_id: session.id,
        block_order: block.block_order,
        duration_min: block.duration_min,
        target_hrr_min: block.target_hrr_min,
        target_hrr_max: block.target_hrr_max,
        machine_settings: block.machine_settings as any,
        block_type: block.block_type
      }));

      const { error: blocksError } = await supabase
        .from('cardio_blocks')
        .insert(blocksWithSessionId);

      if (blocksError) throw blocksError;

      setCurrentSession(session as CardioSession);
      setCurrentBlocks(prescription.blocks);
      setMachineSettings(prescription.initial_settings);
      
      return session.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create workout session",
        variant: "destructive",
      });
      return null;
    }
  };

  const startSession = async () => {
    if (!currentSession) return;

    try {
      // Update session status
      await supabase
        .from('cardio_sessions')
        .update({ status: 'in_progress' })
        .eq('id', currentSession.id);

      // Start heart rate monitoring
      await startHR('functionalStrengthTraining');
      
      setSessionStartTime(new Date());
      setIsSessionActive(true);
      setActiveBlockIndex(0);
      setElapsedTime(0);
      setBlockElapsedTime(0);
      setHrData([]);

      toast({
        title: "Workout Started",
        description: `Starting ${currentBlocks[0]?.block_type} phase`,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start workout",
        variant: "destructive",
      });
    }
  };

  const pauseSession = () => {
    setIsSessionActive(false);
    toast({
      title: "Workout Paused",
      description: "Session paused. Resume when ready.",
    });
  };

  const resumeSession = () => {
    setIsSessionActive(true);
    toast({
      title: "Workout Resumed",
      description: "Session resumed.",
    });
  };

  const completeSession = async () => {
    if (!currentSession || !userProfile) return;

    try {
      setIsSessionActive(false);
      stopHR();

      // Calculate session metrics
      const avgHR = hrData.length > 0 ? 
        Math.round(hrData.reduce((sum, d) => sum + d.bpm, 0) / hrData.length) : 120;
      const maxHR = hrData.length > 0 ? 
        Math.max(...hrData.map(d => d.bpm)) : 140;

      // Calculate time in zones
      const zoneDistribution = calculateTimeInZones(hrData, userProfile);
      const trimpScore = calculateTRIMP(zoneDistribution);
      const caloriesBurned = estimateCaloriesBurned();

      // Create session recording
      const { error: recordingError } = await supabase
        .from('session_recordings')
        .insert({
          session_id: currentSession.id,
          user_id: currentSession.user_id,
          duration_min: Math.round(elapsedTime / 60),
          hr_avg: avgHR,
          hr_max: maxHR,
          rpe: 5, // TODO: Collect from user
          trimp_score: trimpScore,
          calories_burned: caloriesBurned,
          z1_minutes: zoneDistribution.z1_minutes,
          z2_minutes: zoneDistribution.z2_minutes,
          z3_minutes: zoneDistribution.z3_minutes,
          z4_minutes: zoneDistribution.z4_minutes,
          z5_minutes: zoneDistribution.z5_minutes
        });

      if (recordingError) throw recordingError;

      // Update session status
      await supabase
        .from('cardio_sessions')
        .update({ 
          status: 'completed',
          actual_duration: Math.round(elapsedTime / 60),
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      toast({
        title: "Workout Complete!",
        description: `Great job! You burned ~${caloriesBurned} calories in ${Math.round(elapsedTime / 60)} minutes.`,
      });

      // Reset state
      setCurrentSession(null);
      setCurrentBlocks([]);
      setActiveBlockIndex(0);
      setElapsedTime(0);
      setBlockElapsedTime(0);
      setHrData([]);
      setSessionStartTime(null);

    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: "Error",
        description: "Failed to save workout data",
        variant: "destructive",
      });
    }
  };

  const logHeartRateData = async (bpm: number, hrr: number, targetHRR: number) => {
    if (!currentSession) return;

    try {
      await supabase
        .from('heart_rate_data')
        .insert({
          session_id: currentSession.id,
          timestamp_offset: elapsedTime,
          heart_rate_bpm: bpm,
          hrr_percent: hrr,
          target_hrr_percent: targetHRR,
          machine_settings: machineSettings
        });
    } catch (error) {
      // Silent fail for HR logging to avoid interrupting workout
      console.error('HR logging error:', error);
    }
  };

  const calculateTimeInZones = (hrData: { hrr: number }[], profile: CardioUserProfile) => {
    const zones = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
    
    hrData.forEach(data => {
      if (data.hrr < 0.60) zones.z1++;
      else if (data.hrr < 0.70) zones.z2++;
      else if (data.hrr < 0.80) zones.z3++;
      else if (data.hrr < 0.90) zones.z4++;
      else zones.z5++;
    });

    // Convert to minutes (data points are every second)
    return {
      z1_minutes: Math.round(zones.z1 / 60),
      z2_minutes: Math.round(zones.z2 / 60),
      z3_minutes: Math.round(zones.z3 / 60),
      z4_minutes: Math.round(zones.z4 / 60),
      z5_minutes: Math.round(zones.z5 / 60)
    };
  };

  const calculateTRIMP = (zones: any): number => {
    return zones.z1_minutes * 1 + zones.z2_minutes * 2 + zones.z3_minutes * 3 + 
           zones.z4_minutes * 4 + zones.z5_minutes * 5;
  };

  const estimateCaloriesBurned = (): number => {
    if (!userProfile) return 200;
    const avgMETs = 6; // Estimate based on intensity
    const durationHours = elapsedTime / 3600;
    return Math.round(avgMETs * 3.5 * userProfile.weight_kg * durationHours / 200);
  };

  const getAdjustmentMessage = (machineType: string, settings: any): string => {
    switch (machineType) {
      case 'treadmill':
        return `Speed: ${settings.speed_kmh?.toFixed(1)} km/h, Incline: ${settings.incline_pct?.toFixed(1)}%`;
      case 'bike':
        return `Power: ${settings.watts}W, Level: ${settings.resistance_level}`;
      case 'stair_stepper':
        return `Steps/min: ${settings.steps_per_min}, Level: ${settings.level}`;
      default:
        return `Resistance: ${settings.resistance || settings.level}`;
    }
  };

  const getCurrentBlock = (): CardioBlock | null => {
    return currentBlocks[activeBlockIndex] || null;
  };

  const getHeartRateTarget = (): HeartRateTarget | null => {
    const block = getCurrentBlock();
    if (!block || !userProfile) return null;

    return {
      hrr_min: block.target_hrr_min,
      hrr_max: block.target_hrr_max,
      hr_bpm_min: Math.round(userProfile.HR_rest + block.target_hrr_min * (userProfile.HR_max - userProfile.HR_rest)),
      hr_bpm_max: Math.round(userProfile.HR_rest + block.target_hrr_max * (userProfile.HR_max - userProfile.HR_rest))
    };
  };

  return {
    // State
    currentSession,
    currentBlocks,
    activeBlockIndex,
    elapsedTime,
    blockElapsedTime,
    isSessionActive,
    machineSettings,
    userProfile,
    hrData,
    shouldAdjustIntensity,
    connected,
    bpm,

    // Actions
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    setMachineSettings,

    // Getters
    getCurrentBlock,
    getHeartRateTarget,

    // Utilities
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
}