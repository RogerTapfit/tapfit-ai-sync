import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Dumbbell, Heart, Utensils, Footprints } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useDailyStats } from "@/hooks/useDailyStats";
import { useAuth } from "./AuthGuard";
import { useHealthKit } from "@/hooks/useHealthKit";
import { HeartRateScanModal } from "./HeartRateScanModal";

interface TodaysPerformanceProps {
  onStartWorkout: () => void;
}

export const TodaysPerformance = ({ onStartWorkout }: TodaysPerformanceProps) => {
  const { user } = useAuth();
  const stats = useDailyStats(user?.id);
  const { scanHeartRate, isScanning, lastScanResult } = useHealthKit();
  const [showScanModal, setShowScanModal] = useState(false);

  const handleHeartRateClick = () => {
    setShowScanModal(true);
  };

  const handleScan = () => {
    scanHeartRate();
  };
  
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
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.caloriesBurned} duration={2500} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Utensils className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.caloriesConsumed} duration={2200} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Consumed</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Footprints className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.steps} duration={1800} />
          </p>
          <p className="text-sm text-muted-foreground">Steps Today</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Clock className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.workoutDuration} duration={2000} suffix="m" />
          </p>
          <p className="text-sm text-muted-foreground">Workout Time</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Dumbbell className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.exercisesCompleted} duration={2300} />
          </p>
          <p className="text-sm text-muted-foreground">Exercises Done</p>
        </div>

        <div className="text-center space-y-2">
          <button 
            onClick={handleHeartRateClick}
            className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit hover:bg-stats-heart/10 hover:border-stats-heart/30 transition-all duration-200 group cursor-pointer"
          >
            <Heart className="h-6 w-6 text-stats-heart group-hover:animate-pulse" />
          </button>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={stats.loading ? 0 : stats.avgHeartRate} duration={2800} />
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