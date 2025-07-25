import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Target, Heart } from "lucide-react";

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
  return (
    <Card className="glow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Today's Performance</h3>
        <Button className="glow-button" onClick={onStartWorkout}>
          <Activity className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-stats-calories/20 border border-stats-calories/30 mx-auto w-fit">
            <Activity className="h-6 w-6 text-stats-calories" />
          </div>
          <p className="text-2xl font-bold text-stats-calories">{todayStats.calories}</p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-stats-duration/20 border border-stats-duration/30 mx-auto w-fit">
            <Clock className="h-6 w-6 text-stats-duration" />
          </div>
          <p className="text-2xl font-bold text-stats-duration">{todayStats.duration}m</p>
          <p className="text-sm text-muted-foreground">Workout Time</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-stats-exercises/20 border border-stats-exercises/30 mx-auto w-fit">
            <Target className="h-6 w-6 text-stats-exercises" />
          </div>
          <p className="text-2xl font-bold text-stats-exercises">{todayStats.exercises}</p>
          <p className="text-sm text-muted-foreground">Exercises Done</p>
        </div>

        <div className="text-center space-y-2">
          <div className="p-3 rounded-lg bg-stats-heart/20 border border-stats-heart/30 mx-auto w-fit">
            <Heart className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-stats-heart">{todayStats.heartRate}</p>
          <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
        </div>
      </div>
    </Card>
  );
};