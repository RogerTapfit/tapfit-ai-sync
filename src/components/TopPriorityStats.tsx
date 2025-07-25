import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Dumbbell, Heart } from "lucide-react";

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
    <Card className="glow-card p-6 bg-gradient-to-br from-stats-heart/10 via-primary/5 to-stats-calories/10 border-stats-heart/30 animate-fade-in hover-scale">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-stats-heart to-primary bg-clip-text text-transparent">Today's Performance</h3>
        <Button className="bg-gradient-to-r from-stats-heart to-stats-heart/80 hover:from-stats-heart/90 hover:to-stats-heart/70 text-white border-0 shadow-lg" onClick={onStartWorkout}>
          <Activity className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center space-y-2 group">
          <div className="p-3 rounded-lg bg-gradient-to-br from-stats-calories/20 to-stats-calories/10 mx-auto w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-stats-calories/20">
            <Activity className="h-6 w-6 text-stats-calories" />
          </div>
          <p className="text-2xl font-bold text-stats-calories">{todayStats.calories}</p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </div>

        <div className="text-center space-y-2 group">
          <div className="p-3 rounded-lg bg-gradient-to-br from-stats-duration/20 to-stats-duration/10 mx-auto w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-stats-duration/20">
            <Clock className="h-6 w-6 text-stats-duration" />
          </div>
          <p className="text-2xl font-bold text-stats-duration">{todayStats.duration}m</p>
          <p className="text-sm text-muted-foreground">Workout Time</p>
        </div>

        <div className="text-center space-y-2 group">
          <div className="p-3 rounded-lg bg-gradient-to-br from-stats-exercises/20 to-stats-exercises/10 mx-auto w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-stats-exercises/20">
            <Dumbbell className="h-6 w-6 text-stats-exercises" />
          </div>
          <p className="text-2xl font-bold text-stats-exercises">{todayStats.exercises}</p>
          <p className="text-sm text-muted-foreground">Exercises Done</p>
        </div>

        <div className="text-center space-y-2 group">
          <div className="p-3 rounded-lg bg-gradient-to-br from-stats-heart/20 to-stats-heart/10 mx-auto w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-stats-heart/20">
            <Heart className="h-6 w-6 text-stats-heart" />
          </div>
          <p className="text-2xl font-bold text-stats-heart">{todayStats.heartRate}</p>
          <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
        </div>
      </div>
    </Card>
  );
};