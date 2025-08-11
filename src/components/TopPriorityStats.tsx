import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Dumbbell, Heart, Utensils, Footprints } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useDailyStats } from "@/hooks/useDailyStats";
import { useAuth } from "./AuthGuard";
import { useHealthKit } from "@/hooks/useHealthKit";
import { HeartRateScanModal } from "./HeartRateScanModal";
import { Capacitor } from "@capacitor/core";
import { useHeartRate } from "@/hooks/useHeartRate";
interface TodaysPerformanceProps {
  onStartWorkout: () => void;
  onCaloriesConsumedClick?: () => void;
}

export const TodaysPerformance = ({ onStartWorkout, onCaloriesConsumedClick }: TodaysPerformanceProps) => {
  const { user } = useAuth();
  const stats = useDailyStats(user?.id);
  const { scanHeartRate, isScanning, lastScanResult } = useHealthKit();
  const [showScanModal, setShowScanModal] = useState(false);
  const { bpm, start: startHR } = useHeartRate();
  const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

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
  const fake = {
    caloriesBurned: 231,
    caloriesConsumed: 820,
    steps: 4650,
    workoutDuration: 38,
    exercisesCompleted: 7,
    avgHeartRate: 76,
  };

  const dCaloriesBurned = stats.loading ? fake.caloriesBurned : (stats.caloriesBurned || fake.caloriesBurned);
  const dCaloriesConsumed = stats.loading ? fake.caloriesConsumed : (stats.caloriesConsumed || fake.caloriesConsumed);
  const dSteps = stats.loading ? fake.steps : (stats.steps || fake.steps);
  const dWorkoutDuration = stats.loading ? fake.workoutDuration : (stats.workoutDuration || fake.workoutDuration);
  const dExercisesCompleted = stats.loading ? fake.exercisesCompleted : (stats.exercisesCompleted || fake.exercisesCompleted);
  const dAvgHeartRate = bpm ?? (stats.loading ? fake.avgHeartRate : (stats.avgHeartRate || fake.avgHeartRate));

  return (
    <Card className="glow-card p-6 bg-stats-heart/10 border-stats-heart/30 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Today's Performance</h3>
        <Button id="top-start-workout" className="bg-stats-heart hover:bg-stats-heart/90 text-white border-0 animate-heartbeat-glow" onClick={onStartWorkout}>
          <Activity className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Activity className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dCaloriesBurned} duration={2500} />
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
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-200">
            <Utensils className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dCaloriesConsumed} duration={2200} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Consumed</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Footprints className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dSteps} duration={1800} />
          </p>
          <p className="text-sm text-muted-foreground">Steps Today</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Clock className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dWorkoutDuration} duration={2000} suffix="m" />
          </p>
          <p className="text-sm text-muted-foreground">Workout Time</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Dumbbell className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dExercisesCompleted} duration={2300} />
          </p>
          <p className="text-sm text-muted-foreground">Exercises Done</p>
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
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit hover:bg-stats-heart/10 hover:border-stats-heart/30 transition-all duration-200 group">
            <Heart className="h-6 w-6 text-stats-heart group-hover:animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dAvgHeartRate} duration={2800} />
          </p>
          <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
        </div>
      </div>

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