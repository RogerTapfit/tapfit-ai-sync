import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Dumbbell, Heart, Utensils, Footprints, Bike, Waves, Droplet, Moon, Droplets, Smile, Sprout } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useDailyStats } from "@/hooks/useDailyStats";
import { useAuth } from "./AuthGuard";
import { useHealthKit } from "@/hooks/useHealthKit";
import { HeartRateScanModal } from "./HeartRateScanModal";
import { Capacitor } from "@capacitor/core";
import { useHeartRate } from "@/hooks/useHeartRate";
import { useWaterIntake } from "@/hooks/useWaterIntake";
import { WaterQuickAddModal } from "./WaterQuickAddModal";
import { useSleepData } from "@/hooks/useSleepData";
import { SleepTrackerModal } from "./SleepTrackerModal";
import { useCycleTracking } from "@/hooks/useCycleTracking";
import { CycleTrackerModal } from "./CycleTrackerModal";
import { useChatbotContextOptional } from "@/contexts/ChatbotContext";
import { MoodCheckinModal } from "./MoodCheckinModal";
import { useBiometricMood } from "@/hooks/useBiometricMood";
import { SobrietyTrackerModal } from "./SobrietyTrackerModal";
import { useSobrietyTracking } from "@/hooks/useSobrietyTracking";

interface TodaysPerformanceProps {
  onStartWorkout: () => void;
  onStartRun?: () => void;
  onStartRide?: () => void;
  onStartSwim?: () => void;
  onCaloriesConsumedClick?: () => void;
  onCaloriesBurnedClick?: () => void;
}

export const TodaysPerformance = ({ onStartWorkout, onStartRun, onStartRide, onStartSwim, onCaloriesConsumedClick, onCaloriesBurnedClick }: TodaysPerformanceProps) => {
  const { user } = useAuth();
  const stats = useDailyStats(user?.id);
  const { scanHeartRate, isScanning, lastScanResult } = useHealthKit();
  const [showScanModal, setShowScanModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showSobrietyModal, setShowSobrietyModal] = useState(false);
  const { bpm, start: startHR } = useHeartRate();
  const { todaysIntake: waterIntake, dailyGoal: waterGoal } = useWaterIntake();
  const { lastNightSleep, formatDurationShort, targetHours } = useSleepData();
  const { isEnabled: cycleEnabled, calculatePhaseInfo } = useCycleTracking();
  const { todaysMood, readinessScore } = useBiometricMood();
  const { activeJourney: sobrietyJourney, getProgress: getSobrietyProgress } = useSobrietyTracking();
  const sobrietyProgress = getSobrietyProgress();
  const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  const chatbotContext = useChatbotContextOptional();
  const pendingModal = chatbotContext?.pendingModal;
  const clearPendingModal = chatbotContext?.clearPendingModal;

  // Listen for modal triggers from chatbot
  useEffect(() => {
    if (!pendingModal || !clearPendingModal) return;
    
    if (pendingModal === 'water') {
      setShowWaterModal(true);
      clearPendingModal();
    } else if (pendingModal === 'sleep') {
      setShowSleepModal(true);
      clearPendingModal();
    } else if (pendingModal === 'cycle') {
      setShowCycleModal(true);
      clearPendingModal();
    } else if (pendingModal === 'heartRate') {
      setShowScanModal(true);
      clearPendingModal();
    } else if (pendingModal === 'mood') {
      setShowMoodModal(true);
      clearPendingModal();
    } else if (pendingModal === 'sobriety') {
      setShowSobrietyModal(true);
      clearPendingModal();
    }
  }, [pendingModal, clearPendingModal]);

  const cyclePhaseInfo = calculatePhaseInfo(new Date());

  const handleHeartRateClick = async () => {
    if (isIOSNative) {
      await startHR('functionalStrengthTraining');
    } else {
      setShowScanModal(true);
    }
  };

  const handleScan = () => {
    scanHeartRate();
  };

  const { isGuest } = useAuth();

  const getPhaseName = (phase: string | null) => {
    switch (phase) {
      case 'menstrual': return 'Period';
      case 'follicular': return 'Follicular';
      case 'ovulation': return 'Ovulation';
      case 'luteal': return 'Luteal';
      default: return 'Setup';
    }
  };

  return (
    <Card className="glow-card p-6 bg-stats-heart/10 border-stats-heart/30 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-bold">Today's Performance</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button id="top-start-workout" className="bg-stats-heart hover:bg-stats-heart/90 text-white border-0" onClick={onStartWorkout}>
            <span className="inline-flex items-center gap-2 leading-none">
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <Activity className="size-4 block" />
              </span>
              <span className="leading-none">Start Workout</span>
            </span>
          </Button>
          {onStartRun && (
            <Button className="bg-orange-700 hover:bg-orange-800 text-white border-0" onClick={onStartRun}>
              <span className="inline-flex items-center gap-2 leading-none">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Footprints className="size-4 block" />
                </span>
                <span className="leading-none">Start Run</span>
              </span>
            </Button>
          )}
          {onStartRide && (
            <Button className="bg-green-700 hover:bg-green-800 text-white border-0" onClick={onStartRide}>
              <span className="inline-flex items-center gap-2 leading-none">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Bike className="size-4 block" />
                </span>
                <span className="leading-none">Start Ride</span>
              </span>
            </Button>
          )}
          {onStartSwim && (
            <Button className="bg-cyan-700 hover:bg-cyan-800 text-white border-0" onClick={onStartSwim}>
              <span className="inline-flex items-center gap-2 leading-none">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Waves className="size-4 block" />
                </span>
                <span className="leading-none">Start Swim</span>
              </span>
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4">
        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => onCaloriesBurnedClick?.()}
          role="button"
          aria-label="View workout history"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCaloriesBurnedClick?.();
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-stats-heart/10 hover:border-stats-heart/30 transition-all duration-200">
            <Activity className="size-6 block text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.caloriesBurned} duration={2500} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </div>

        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => onCaloriesConsumedClick?.()}
          role="button"
          aria-label="View logged meals"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCaloriesConsumedClick?.();
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-200">
            <Utensils className="size-6 block text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.caloriesConsumed} duration={2200} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Consumed</p>
        </div>

        <div className="text-center space-y-2">
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center">
            <Footprints className="size-6 block text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.steps} duration={1800} />
          </p>
          <p className="text-sm text-muted-foreground">Steps Today</p>
        </div>

        <div className="text-center space-y-2">
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center">
            <Clock className="size-6 block text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.workoutDuration} duration={2000} suffix="m" />
          </p>
          <p className="text-sm text-muted-foreground">Workout Time</p>
        </div>

        <div className="text-center space-y-2">
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center">
            <Dumbbell className="size-6 block text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.exercisesCompleted} duration={2300} />
          </p>
          <p className="text-sm text-muted-foreground">Exercises Done</p>
        </div>

        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => setShowWaterModal(true)}
          role="button"
          aria-label="Track water intake"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowWaterModal(true);
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all duration-200">
            <Droplet className="size-6 block text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={waterIntake} duration={1500} suffix="oz" />
          </p>
          <p className="text-sm text-muted-foreground">Water ({waterGoal}oz goal)</p>
        </div>

        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={handleHeartRateClick}
          role="button"
          aria-label="Start live heart rate"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleHeartRateClick();
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-stats-heart/10 hover:border-stats-heart/30 transition-all duration-200 group">
            <Heart className="size-6 block text-stats-heart group-hover:animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={bpm ?? (stats.loading ? 0 : stats.avgHeartRate)} duration={2800} />
          </p>
          <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
        </div>

        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => setShowSleepModal(true)}
          role="button"
          aria-label="Track sleep"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowSleepModal(true);
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200">
            <Moon className="size-6 block text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {lastNightSleep?.duration_minutes 
              ? formatDurationShort(lastNightSleep.duration_minutes) 
              : '--'}
          </p>
          <p className="text-sm text-muted-foreground">Sleep ({targetHours}h goal)</p>
        </div>

        {/* Mood Tracker Tile */}
        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => setShowMoodModal(true)}
          role="button"
          aria-label="Track mood"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowMoodModal(true);
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all duration-200">
            <Smile className="size-6 block text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isGuest ? 'Login' : (todaysMood ? `${todaysMood.moodScore}/10` : (readinessScore ? `${readinessScore.total}%` : '--'))}
          </p>
          <p className="text-sm text-muted-foreground">
            {isGuest ? 'to Track' : (todaysMood ? 'Mood' : (readinessScore ? 'Readiness' : 'Log Mood'))}
          </p>
        </div>

        {/* Cycle Tracker Tile */}
        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => setShowCycleModal(true)}
          role="button"
          aria-label="Track cycle"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowCycleModal(true);
            }
          }}
        >
          <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-pink-500/10 hover:border-pink-500/30 transition-all duration-200">
            <Droplets className="size-6 block text-pink-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isGuest ? 'Login' : (cycleEnabled && cyclePhaseInfo ? `Day ${cyclePhaseInfo.cycleDay}` : 'Setup')}
          </p>
          <p className="text-sm text-muted-foreground">
            {isGuest ? 'to Track' : (cycleEnabled && cyclePhaseInfo ? getPhaseName(cyclePhaseInfo.phase) : 'Cycle')}
          </p>
        </div>

        {/* Sobriety Tracker Tile */}
        <div
          className="text-center space-y-2 cursor-pointer select-none"
          onClick={() => setShowSobrietyModal(true)}
          role="button"
          aria-label="Track sobriety"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowSobrietyModal(true);
            }
          }}
        >
          <div className={`size-10 rounded-lg bg-primary/5 border border-primary/10 mx-auto flex items-center justify-center hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-200 ${sobrietyJourney && sobrietyProgress ? 'animate-sober-glow' : ''}`}>
            <Sprout className={`size-6 block ${sobrietyJourney && sobrietyProgress ? 'text-emerald-400' : 'text-green-500'}`} />
          </div>
          <p className="text-2xl font-bold text-white">
            {isGuest ? 'Login' : (sobrietyJourney && sobrietyProgress ? sobrietyProgress.currentDay : 1)}
          </p>
          <p className="text-sm text-muted-foreground">
            {isGuest ? 'to Track' : (sobrietyJourney && sobrietyProgress ? 'Sober Days' : 'Sobriety')}
          </p>
        </div>
      </div>

      <WaterQuickAddModal open={showWaterModal} onOpenChange={setShowWaterModal} />
      <SleepTrackerModal open={showSleepModal} onOpenChange={setShowSleepModal} />
      <CycleTrackerModal open={showCycleModal} onOpenChange={setShowCycleModal} />
      <MoodCheckinModal open={showMoodModal} onOpenChange={setShowMoodModal} />
      <SobrietyTrackerModal open={showSobrietyModal} onOpenChange={setShowSobrietyModal} />

      <HeartRateScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        isScanning={isScanning}
        scanResult={lastScanResult}
        onScan={handleScan}
        avgHeartRate={stats.avgHeartRate}
      />
    </Card>
  );
};
