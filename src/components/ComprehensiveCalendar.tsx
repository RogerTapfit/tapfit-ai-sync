import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCalendarData, CalendarDay } from '@/hooks/useCalendarData';
import { CalendarDayDetail } from './CalendarDayDetail';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Dumbbell,
  Utensils,
  Activity,
  Footprints
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
          <div key="workout-completed" className="w-2 h-2 bg-green-500 rounded-full" />
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

    return indicators;
  };

  const isToday = (day: CalendarDay | null) => {
    if (!day) return false;
    const today = new Date().toISOString().split('T')[0];
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden glow-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Fitness Calendar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{formatMonth()}</h2>
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

            {/* Legend */}
            <Card className="p-3 glow-card">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Completed Workouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Scheduled Workouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Food Logged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Steps Tracked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Tap Coins Earned</span>
                </div>
              </div>
            </Card>

            {/* Calendar Grid */}
            <Card className="p-4 glow-card">
              {loading ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 42 }, (_, i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Week day headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleDayClick(day)}
                        disabled={!day}
                        className={`
                          aspect-square p-2 rounded-lg border transition-all duration-200 relative
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
                            <div className="text-sm">
                              {day.date.getDate()}
                            </div>
                            
                            {/* Activity indicators */}
                            {day.hasActivity && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
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
            <Card className="p-4 glow-card">
              <h3 className="font-semibold mb-3">Monthly Overview</h3>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-stats-exercises">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.workouts.filter(w => w.type === 'completed').length || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-stats-calories">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.dailyStats.caloriesBurned || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-stats-heart">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.foodEntries.length || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Meals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {calendarDays.reduce((sum, day) => 
                      sum + (day?.dailyStats.tapCoinsEarned || 0), 0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Tap Coins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-stats-duration">
                    {calendarDays.filter(day => day?.hasActivity).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Days</div>
                </div>
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