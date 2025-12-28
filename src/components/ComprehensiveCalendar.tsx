import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCalendarData, CalendarDay } from '@/hooks/useCalendarData';
import { CalendarDayDetail } from './CalendarDayDetail';
import { useCycleTracking } from '@/hooks/useCycleTracking';
import { getCurrentLocalDate } from '@/utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Dumbbell,
  Utensils,
  Activity,
  Footprints,
  Moon,
  Droplets,
  Sprout
} from 'lucide-react';
import { useAuth } from './AuthGuard';

interface ComprehensiveCalendarProps {
  trigger?: React.ReactNode;
}

export const ComprehensiveCalendar: React.FC<ComprehensiveCalendarProps> = ({ trigger }) => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCycleData, setShowCycleData] = useState(true);
  const { isEnabled: cycleTrackingEnabled } = useCycleTracking();

  const {
    calendarDays,
    currentMonth,
    loading,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useCalendarData(user?.id);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (day: CalendarDay | null) => {
    if (day) {
      setSelectedDay(day);
      setShowDayDetail(true);
    }
  };

  const getActivityIndicators = (day: CalendarDay) => {
    const indicators = [];
    
    if (day.workouts.length > 0) {
      const completedCount = day.workouts.filter(w => w.type === 'completed').length;
      const scheduledCount = day.workouts.filter(w => w.type === 'scheduled').length;
      
      if (completedCount > 0) {
        indicators.push(
          <div key="workout-completed" className="w-2 h-2 bg-lime-500 rounded-full" />
        );
      } else if (scheduledCount > 0) {
        indicators.push(
          <div key="workout-scheduled" className="w-2 h-2 bg-blue-500 rounded-full" />
        );
      }
    }

    if (day.foodEntries.length > 0) {
      indicators.push(
        <div key="food" className="w-2 h-2 bg-orange-500 rounded-full" />
      );
    }

    // Check for alcohol: legacy entries OR dehydrating beverages from hydration tracker
    const hasAlcoholEntries = day.alcoholEntries.length > 0 || 
      day.waterEntries.some(entry => entry.isDehydrating);
    
    if (hasAlcoholEntries) {
      indicators.push(
        <div key="alcohol" className="w-2 h-2 bg-red-500 rounded-full" />
      );
    }

    if (day.steps > 0) {
      indicators.push(
        <div key="steps" className="w-2 h-2 bg-purple-500 rounded-full" />
      );
    }

    if (day.tapCoins.length > 0 && day.dailyStats.tapCoinsEarned > 0) {
      indicators.push(
        <div key="coins" className="w-2 h-2 bg-yellow-500 rounded-full" />
      );
    }

    // Sobriety indicator is now shown prominently under the day number, not in the dots

    // Add cycle tracking indicators
    if (showCycleData && cycleTrackingEnabled && day.cyclePhase) {
      if (day.cyclePhase.isInPeriod) {
        indicators.push(
          <div key="period" className="w-2 h-2 bg-red-600 rounded-full" />
        );
      } else if (day.cyclePhase.isOvulation) {
        indicators.push(
          <div key="ovulation" className="w-2 h-2 bg-purple-600 rounded-full" />
        );
      } else if (day.cyclePhase.isFertileWindow) {
        indicators.push(
          <div key="fertile" className="w-2 h-2 bg-blue-400 rounded-full" />
        );
      } else if (day.cyclePhase.phase === 'luteal') {
        indicators.push(
          <div key="luteal" className="w-2 h-2 bg-indigo-600 rounded-full" />
        );
      }
    }

    return indicators;
  };

  const isToday = (day: CalendarDay | null) => {
    if (!day) return false;
    const today = getCurrentLocalDate();
    return day.dateString === today;
  };

  const isCurrentMonth = (day: CalendarDay | null) => {
    if (!day) return false;
    return day.date.getMonth() === currentMonth.getMonth();
  };

  const formatMonth = () => {
    return currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const defaultTrigger = (
    <Button variant="outline" className="glow-card">
      <CalendarIcon className="h-4 w-4 mr-2" />
      Calendar
    </Button>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto glow-card p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Fitness Calendar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-visible">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{formatMonth()}</h2>
              <div className="flex items-center gap-4">
                {cycleTrackingEnabled && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-cycle"
                      checked={showCycleData}
                      onCheckedChange={setShowCycleData}
                    />
                    <Label htmlFor="show-cycle" className="text-sm">
                      Show Cycle Data
                    </Label>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <Card className="p-3 glow-card">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-lime-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Food Logged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Alcohol</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Tap Coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-3 h-3 text-emerald-400 animate-sober-glow flex-shrink-0" strokeWidth={3} />
                  <span className="truncate">Sober Day</span>
                </div>
                {showCycleData && cycleTrackingEnabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full flex-shrink-0"></div>
                      <span className="truncate">Period</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
                      <span className="truncate">Ovulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span className="truncate">Fertile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full flex-shrink-0"></div>
                      <span className="truncate">Luteal</span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Calendar Grid */}
            <Card className="p-3 sm:p-4 glow-card">
              {loading ? (
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {Array.from({ length: 42 }, (_, i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Week day headers */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-xs sm:text-sm font-semibold text-muted-foreground p-1 sm:p-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleDayClick(day)}
                        disabled={!day}
                        className={`
                          aspect-square p-1 sm:p-2 rounded-lg border transition-all duration-200 relative min-h-[40px] sm:min-h-[60px]
                          ${day && isCurrentMonth(day)
                            ? 'hover:bg-accent/50 border-border'
                            : 'border-transparent text-muted-foreground/50'
                          }
                          ${day && isToday(day)
                            ? 'bg-primary/20 border-primary text-primary font-bold'
                            : ''
                          }
                          ${day && day.hasActivity && !isToday(day)
                            ? 'bg-accent/30 border-accent'
                            : ''
                          }
                        `}
                      >
                        {day && (
                          <>
                            <div className="text-xs sm:text-sm">
                              {day.date.getDate()}
                            </div>
                            
                            {/* Prominent Sober Leaf - directly under date, 2x larger */}
                            {day.sobrietyCheckin && (
                              <div className="flex justify-center mt-0.5">
                                <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-sober-glow" strokeWidth={2.5} />
                              </div>
                            )}
                            
                            {/* Activity indicators */}
                            {day.hasActivity && (
                              <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 sm:gap-1">
                                {getActivityIndicators(day)}
                              </div>
                            )}

                            {/* Quick stats for today */}
                            {isToday(day) && day.hasActivity && (
                              <div className="absolute top-0 right-0 text-xs">
                                <Badge variant="secondary" className="text-xs px-1">
                                  {day.workouts.filter(w => w.type === 'completed').length +
                                   day.foodEntries.length}
                                </Badge>
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Monthly Stats Summary */}
            <Card className="p-3 sm:p-4 glow-card">
              <h3 className="font-semibold mb-3 text-sm sm:text-base">Monthly Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-stats-exercises">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.workouts.filter(w => w.type === 'completed').length || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-stats-calories">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.dailyStats.caloriesBurned || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-stats-heart">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.foodEntries.length || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Meals</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-red-600">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.dailyStats.alcoholDrinks || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Drinks</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-500">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.dailyStats.tapCoinsEarned || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Tap Coins</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-stats-duration">
                    {calendarDays.filter(day => day?.hasActivity).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Days</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-400 animate-sober-glow">
                    {calendarDays.filter(day => day?.sobrietyCheckin).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Sober Days 🌱</div>
                </div>
                {showCycleData && cycleTrackingEnabled && (
                  <>
                    <div className="space-y-1">
                      <div className="text-lg sm:text-2xl font-bold text-red-600">
                        {calendarDays.filter(day => day?.cyclePhase?.isInPeriod).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Period Days</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">
                        {calendarDays.filter(day => day?.cyclePhase?.isOvulation).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Ovulation</div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Detail Modal */}
      <CalendarDayDetail
        day={selectedDay}
        open={showDayDetail}
        onOpenChange={setShowDayDetail}
      />
    </>
  );
};