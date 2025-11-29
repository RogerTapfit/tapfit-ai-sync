import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDay, WorkoutActivity, FoodActivity, TapCoinsActivity, AlcoholActivity, SleepActivity } from '@/hooks/useCalendarData';
import { useCycleTracking } from '@/hooks/useCycleTracking';
import { getCurrentLocalDate } from '@/utils/dateUtils';
import { BurnedCaloriesBreakdown } from './calendar/BurnedCaloriesBreakdown';
import { ConsumedCaloriesBreakdown } from './calendar/ConsumedCaloriesBreakdown';
import { ExercisesBreakdown } from './calendar/ExercisesBreakdown';
import { WorkoutTimeBreakdown } from './calendar/WorkoutTimeBreakdown';
import { 
  Dumbbell, 
  Utensils, 
  Clock, 
  Target, 
  Flame, 
  Activity,
  CheckCircle,
  AlertCircle,
  Camera,
  ChevronRight,
  Apple,
  Coins,
  Wine,
  Moon,
  Droplets,
  Heart,
  TrendingUp,
  Star,
  BedDouble,
  Sun
} from 'lucide-react';

interface CalendarDayDetailProps {
  day: CalendarDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalendarDayDetail: React.FC<CalendarDayDetailProps> = ({
  day,
  open,
  onOpenChange,
}) => {
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>(null);
  const { getCycleInsights } = useCycleTracking();

  if (!day) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWorkoutStatusIcon = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getWorkoutStatusColor = (type: WorkoutActivity['type']) => {
    switch (type) {
      case 'completed':
        return 'bg-black dark:bg-black border-green-500/30 text-white';
      case 'missed':
        return 'bg-black dark:bg-black border-red-500/30 text-white';
      default:
        return 'bg-black dark:bg-black border-blue-500/30 text-white';
    }
  };

  const getMuscleGroupEmoji = (muscleGroup: string) => {
    const emojis: { [key: string]: string } = {
      chest: '💪',
      back: '🦵',
      shoulders: '🏋️',
      arms: '💪',
      legs: '🦵',
      core: '🎯',
      cardio: '❤️',
      full_body: '🔥',
    };
    return emojis[muscleGroup.toLowerCase()] || '🏃';
  };

  const getMealTypeEmoji = (mealType: string) => {
    const emojis: { [key: string]: string } = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
      beverage: '🥤',
    };
    return emojis[mealType.toLowerCase()] || '🍽️';
  };

  const getHealthGradeColor = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a':
        return 'text-green-400';
      case 'b':
        return 'text-blue-400';
      case 'c':
        return 'text-yellow-400';
      case 'd':
      case 'f':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  // Format sleep duration
  const formatSleepDuration = (minutes: number | null): string => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format time for display
  const formatSleepTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate sleep stage percentage
  const calculateSleepPercentage = (stageMinutes: number | null, totalMinutes: number | null): number => {
    if (!stageMinutes || !totalMinutes || totalMinutes === 0) return 0;
    return Math.round((stageMinutes / totalMinutes) * 100);
  };

  const isToday = day.dateString === getCurrentLocalDate();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glow-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {isToday && <span className="text-primary">•</span>}
              {formatDate(day.date)}
              {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cycle Phase Info */}
            {day.cyclePhase && (
              <Card className="p-4 glow-card border-l-4 border-l-primary">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  Cycle Phase
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {day.cyclePhase.isInPeriod && <Droplets className="h-4 w-4 text-red-500" />}
                      {day.cyclePhase.isOvulation && <Activity className="h-4 w-4 text-purple-500" />}
                      {day.cyclePhase.isFertileWindow && !day.cyclePhase.isOvulation && <Heart className="h-4 w-4 text-blue-400" />}
                      <span className="font-medium capitalize">{day.cyclePhase.phase} Phase</span>
                    </span>
                    <Badge variant="secondary">Day {day.cyclePhase.cycleDay}</Badge>
                  </div>
                  {day.cyclePhase.phase && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {getCycleInsights(day.cyclePhase.phase).phase_description}
                      </p>
                      {getCycleInsights(day.cyclePhase.phase).calorie_adjustment > 0 && (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <TrendingUp className="h-4 w-4" />
                          Higher metabolism: +{getCycleInsights(day.cyclePhase.phase).calorie_adjustment} cal/day
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {getCycleInsights(day.cyclePhase.phase).workout_recommendations.slice(0, 3).map((rec, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {rec.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Daily Summary - Clickable Cards */}
            <Card className="glow-card p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Daily Summary (Click to view details)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Burned Calories */}
                <Button
                  variant="ghost"
                  className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                  onClick={() => setActiveBreakdown('burned')}
                >
                  <div className="flex items-center space-x-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-500">{day.dailyStats.caloriesBurned}</div>
                    <div className="text-xs text-muted-foreground">Burned</div>
                  </div>
                </Button>

                {/* Consumed Calories */}
                <Button
                  variant="ghost"
                  className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-green-500/10 border border-transparent hover:border-green-500/20 transition-all duration-200"
                  onClick={() => setActiveBreakdown('consumed')}
                >
                  <div className="flex items-center space-x-2">
                    <Apple className="h-4 w-4 text-green-500" />
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-500">{day.dailyStats.caloriesConsumed}</div>
                    <div className="text-xs text-muted-foreground">Consumed</div>
                  </div>
                </Button>

                {/* Exercises */}
                <Button
                  variant="ghost"
                  className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all duration-200"
                  onClick={() => setActiveBreakdown('exercises')}
                >
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-4 w-4 text-blue-500" />
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-500">{day.dailyStats.exercisesCompleted}</div>
                    <div className="text-xs text-muted-foreground">Exercises</div>
                  </div>
                </Button>

                {/* Workout Time */}
                <Button
                  variant="ghost"
                  className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all duration-200"
                  onClick={() => setActiveBreakdown('time')}
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-500">{day.dailyStats.workoutDuration}m</div>
                    <div className="text-xs text-muted-foreground">Workout</div>
                  </div>
                </Button>

                {/* Tap Coins */}
                <Button
                  variant="ghost"
                  className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20 transition-all duration-200"
                  disabled
                >
                  <div className="flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-500">{day.dailyStats.tapCoinsEarned}</div>
                    <div className="text-xs text-muted-foreground">Tap Coins</div>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Workouts Section */}
            {day.workouts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Workouts ({day.workouts.length})
                </h3>
                <div className="space-y-3">
                  {day.workouts.map((workout) => (
                    <Card key={workout.id} className={`p-4 border ${getWorkoutStatusColor(workout.type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getWorkoutStatusIcon(workout.type)}
                            <span className="font-semibold text-white">{workout.name}</span>
                            <span className="text-lg">{getMuscleGroupEmoji(workout.muscleGroup)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {workout.time || `${workout.duration}min`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {workout.exercises} exercises
                            </div>
                            {workout.calories && (
                              <div className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {workout.calories} cal
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize border-white/30 text-white">
                          {workout.type}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Food Entries Section */}
            {day.foodEntries.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Food Entries ({day.foodEntries.length})
                </h3>
                <div className="space-y-3">
                  {day.foodEntries.map((food) => (
                    <Card key={food.id} className="p-4 glow-card">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMealTypeEmoji(food.mealType)}</span>
                            <span className="font-semibold capitalize">{food.mealType}</span>
                            {food.healthGrade && (
                              <Badge variant="outline" className={getHealthGradeColor(food.healthGrade)}>
                                Grade {food.healthGrade}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {food.totalCalories} cal
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(food.time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {food.photoUrl && (
                              <div className="flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                Photo
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {food.photoUrl && (
                        <div className="mt-3">
                          <img 
                            src={food.photoUrl} 
                            alt="Food photo" 
                            className="rounded-lg max-h-32 object-cover"
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Alcohol Entries Section */}
            {day.alcoholEntries.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Wine className="h-5 w-5 text-red-500" />
                  Alcohol Consumption ({day.alcoholEntries.length})
                </h3>
                <div className="space-y-3">
                  {day.alcoholEntries.map((alcohol) => (
                    <Card key={alcohol.id} className="p-4 glow-card border-red-500/20">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Wine className="h-4 w-4 text-red-500" />
                            <span className="font-semibold">{alcohol.drinkType}</span>
                            {alcohol.alcoholContent > 0 && (
                              <Badge variant="outline" className="text-red-500 border-red-500/30">
                                {alcohol.alcoholContent}% ABV
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(alcohol.time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="text-red-600 font-medium">
                              {alcohol.quantity} {alcohol.quantity === 1 ? 'drink' : 'drinks'}
                            </div>
                          </div>
                          {alcohol.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{alcohol.notes}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sleep Log Section */}
            {day.sleepLog && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  Sleep Log
                </h3>
                <Card className="p-4 glow-card border-indigo-500/20">
                  {/* Duration and Quality */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-indigo-400">
                      {formatSleepDuration(day.sleepLog.durationMinutes)}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${
                            star <= (day.sleepLog?.qualityScore || 0) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-muted-foreground/30'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Bedtime and Wake time */}
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-indigo-400" />
                      <span>Bedtime: {formatSleepTime(day.sleepLog.bedtime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-400" />
                      <span>Wake: {formatSleepTime(day.sleepLog.wakeTime)}</span>
                    </div>
                  </div>
                  
                  {/* Sleep breakdown bars */}
                  {(day.sleepLog.deepSleepMinutes || day.sleepLog.remSleepMinutes || day.sleepLog.lightSleepMinutes) && (
                    <div className="space-y-2 mb-4">
                      {day.sleepLog.deepSleepMinutes && day.sleepLog.deepSleepMinutes > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-12 text-muted-foreground">Deep</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${calculateSleepPercentage(day.sleepLog.deepSleepMinutes, day.sleepLog.durationMinutes)}%` }}
                            />
                          </div>
                          <span className="text-xs w-8 text-muted-foreground">
                            {calculateSleepPercentage(day.sleepLog.deepSleepMinutes, day.sleepLog.durationMinutes)}%
                          </span>
                        </div>
                      )}
                      {day.sleepLog.remSleepMinutes && day.sleepLog.remSleepMinutes > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-12 text-muted-foreground">REM</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${calculateSleepPercentage(day.sleepLog.remSleepMinutes, day.sleepLog.durationMinutes)}%` }}
                            />
                          </div>
                          <span className="text-xs w-8 text-muted-foreground">
                            {calculateSleepPercentage(day.sleepLog.remSleepMinutes, day.sleepLog.durationMinutes)}%
                          </span>
                        </div>
                      )}
                      {day.sleepLog.lightSleepMinutes && day.sleepLog.lightSleepMinutes > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-12 text-muted-foreground">Light</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-400 rounded-full transition-all"
                              style={{ width: `${calculateSleepPercentage(day.sleepLog.lightSleepMinutes, day.sleepLog.durationMinutes)}%` }}
                            />
                          </div>
                          <span className="text-xs w-8 text-muted-foreground">
                            {calculateSleepPercentage(day.sleepLog.lightSleepMinutes, day.sleepLog.durationMinutes)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Awakenings */}
                  {day.sleepLog.awakenings > 0 && (
                    <div className="text-sm text-muted-foreground mb-3">
                      Awakenings: {day.sleepLog.awakenings} time{day.sleepLog.awakenings > 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Notes - prominent display */}
                  {day.sleepLog.notes && (
                    <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <div className="text-xs text-indigo-400 mb-1 font-medium">Notes</div>
                      <p className="text-sm">{day.sleepLog.notes}</p>
                    </div>
                  )}
                  
                  {/* Source badge */}
                  <div className="mt-3">
                    <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
                      {day.sleepLog.source === 'healthkit' ? '⌚ Apple Watch' : '✏️ Manual Entry'}
                    </Badge>
                  </div>
                </Card>
              </div>
            )}

            {/* Tap Coins Section */}
            {day.tapCoins.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Tap Coins Earned ({day.dailyStats.tapCoinsEarned} coins)
                </h3>
                <div className="space-y-3">
                  {day.tapCoins
                    .filter(coin => coin.amount > 0)
                    .map((coin) => (
                    <Card key={coin.id} className="p-4 glow-card border-yellow-500/20">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-yellow-500">+{coin.amount} coins</span>
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                              {coin.transactionType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{coin.description}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(coin.time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!day.hasActivity && (
              <Card className="p-8 text-center glow-card">
                <div className="space-y-3">
                  <div className="text-4xl">😴</div>
                  <h3 className="text-lg font-semibold text-muted-foreground">Rest Day</h3>
                  <p className="text-sm text-muted-foreground">
                    No workouts, food, or alcohol logged on this day
                  </p>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Breakdown Modals */}
      <BurnedCaloriesBreakdown
        open={activeBreakdown === 'burned'}
        onOpenChange={(open) => !open && setActiveBreakdown(null)}
        workouts={day.workouts}
        cardioSessions={day.cardioSessions}
        totalCalories={day.dailyStats.caloriesBurned}
        date={day.date}
      />

      <ConsumedCaloriesBreakdown
        open={activeBreakdown === 'consumed'}
        onOpenChange={(open) => !open && setActiveBreakdown(null)}
        foodEntries={day.foodEntries}
        totalCalories={day.dailyStats.caloriesConsumed}
        date={day.date}
      />

      <ExercisesBreakdown
        open={activeBreakdown === 'exercises'}
        onOpenChange={(open) => !open && setActiveBreakdown(null)}
        workouts={day.workouts}
        totalExercises={day.dailyStats.exercisesCompleted}
        date={day.date}
      />

      <WorkoutTimeBreakdown
        open={activeBreakdown === 'time'}
        onOpenChange={(open) => !open && setActiveBreakdown(null)}
        workouts={day.workouts}
        totalTime={day.dailyStats.workoutDuration}
        date={day.date}
      />
    </>
  );
};