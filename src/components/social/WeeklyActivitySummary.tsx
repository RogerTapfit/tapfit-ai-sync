import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DayWorkoutDetail } from './DayWorkoutDetail';

interface DayWorkout {
  date: Date;
  dayName: string;
  hasWorkout: boolean;
  workoutCount: number;
  workoutIds: string[];
}

interface WeeklyActivitySummaryProps {
  stats: {
    totalWorkouts: number;
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    totalCalories: number;
    dailyBreakdown: DayWorkout[];
    topExercises: { name: string; count: number }[];
  } | null;
  loading?: boolean;
}

export const WeeklyActivitySummary = ({ stats, loading }: WeeklyActivitySummaryProps) => {
  const [selectedDay, setSelectedDay] = useState<DayWorkout | null>(null);

  if (loading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4" />
        <div className="flex gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-10 h-14 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">This Week</h3>
        </div>
        <p className="text-muted-foreground text-center py-4">No activity this week</p>
      </div>
    );
  }

  const today = new Date();
  const isToday = (date: Date) => 
    date.toDateString() === today.toDateString();

  const handleDayClick = (day: DayWorkout) => {
    if (day.hasWorkout) {
      setSelectedDay(selectedDay?.date.toDateString() === day.date.toDateString() ? null : day);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">This Week</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Dumbbell className="w-3 h-3" />
          {stats.totalWorkouts} {stats.totalWorkouts === 1 ? 'workout' : 'workouts'}
        </Badge>
      </div>

      {/* Day-by-Day Calendar */}
      <div className="flex justify-between gap-1 sm:gap-2 mb-4">
        {stats.dailyBreakdown.map((day, index) => (
          <motion.div
            key={day.dayName}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleDayClick(day)}
            className={cn(
              "flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all",
              isToday(day.date) && "ring-2 ring-primary/50",
              day.hasWorkout 
                ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30" 
                : "bg-muted/30 text-muted-foreground",
              selectedDay?.date.toDateString() === day.date.toDateString() && "ring-2 ring-primary bg-primary/30"
            )}
          >
            <span className="text-xs font-medium">{day.dayName}</span>
            <div className={cn(
              "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mt-1",
              day.hasWorkout 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50"
            )}>
              {day.hasWorkout ? (
                <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <span className="text-xs">-</span>
              )}
            </div>
            {day.workoutCount > 1 && (
              <span className="text-xs mt-1 font-bold">{day.workoutCount}x</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Selected Day Workout Details */}
      {selectedDay && (
        <DayWorkoutDetail
          date={selectedDay.date}
          workoutIds={selectedDay.workoutIds}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-background/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">{stats.totalSets}</p>
          <p className="text-xs text-muted-foreground">Sets</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">{stats.totalReps}</p>
          <p className="text-xs text-muted-foreground">Reps</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">
            {stats.totalVolume >= 1000 
              ? `${(stats.totalVolume / 1000).toFixed(1)}k` 
              : stats.totalVolume}
          </p>
          <p className="text-xs text-muted-foreground">lbs Volume</p>
        </div>
      </div>

      {/* Top Exercises */}
      {stats.topExercises.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Top Exercises</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topExercises.map((exercise, i) => (
              <Badge 
                key={exercise.name} 
                variant={i === 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {exercise.name} ({exercise.count})
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
