import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Dumbbell, Heart, Utensils } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useNutrition } from "@/hooks/useNutrition";

interface TodaysPerformanceProps {
  todayStats: {
    calories: number;
    duration: number;
    exercises: number;
    heartRate: number;
  };
  onStartWorkout: () => void;
}

export const TodaysPerformance = ({ todayStats, onStartWorkout }: TodaysPerformanceProps) => {
  const { dailySummary } = useNutrition();
  
  return (
    <Card className="glow-card p-6 bg-stats-heart/10 border-stats-heart/30 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Today's Performance</h3>
        <Button className="bg-stats-heart hover:bg-stats-heart/90 text-white border-0 animate-heartbeat-glow" onClick={onStartWorkout}>
          <Activity className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Activity className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={todayStats.calories} duration={2500} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Clock className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={todayStats.duration} duration={2200} suffix="m" />
          </p>
          <p className="text-sm text-muted-foreground">Workout Time</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Dumbbell className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={todayStats.exercises} duration={1800} />
          </p>
          <p className="text-sm text-muted-foreground">Exercises Done</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Heart className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={todayStats.heartRate} duration={2800} />
          </p>
          <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mx-auto w-fit">
            <Utensils className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber finalValue={dailySummary?.meals_count || 0} duration={2000} />
          </p>
          <p className="text-sm text-muted-foreground">Meals Logged</p>
        </div>
      </div>
    </Card>
  );
};