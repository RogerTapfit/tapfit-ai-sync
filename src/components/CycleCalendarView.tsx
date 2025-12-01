import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

interface CycleDay {
  date: Date;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isPredicted: boolean;
}

interface CycleCalendarViewProps {
  cycleDays: CycleDay[];
  onDateClick?: (date: Date) => void;
  lastPeriodStart?: Date;
  onMonthChange?: (date: Date) => void;
}

export const CycleCalendarView = ({ 
  cycleDays, 
  onDateClick,
  lastPeriodStart,
  onMonthChange 
}: CycleCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);
  
  // Create empty slots for days before the month starts
  const emptySlots = Array(startDayOfWeek).fill(null);

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const getCycleDayInfo = (date: Date): CycleDay | undefined => {
    return cycleDays.find(cd => isSameDay(cd.date, date));
  };

  const getDayClasses = (date: Date, cycleInfo?: CycleDay) => {
    const isToday = isSameDay(date, today);
    const isLastPeriodStart = lastPeriodStart && isSameDay(date, lastPeriodStart);
    
    let bgClass = 'bg-transparent';
    let textClass = 'text-foreground';
    let ringClass = '';

    if (cycleInfo?.isOvulation) {
      bgClass = 'bg-purple-500/30';
      textClass = 'text-purple-200';
    } else if (cycleInfo?.isPeriod) {
      bgClass = cycleInfo.isPredicted ? 'bg-red-500/20' : 'bg-red-500/40';
      textClass = 'text-red-200';
    } else if (cycleInfo?.isFertile) {
      bgClass = 'bg-pink-500/20';
      textClass = 'text-pink-200';
    }

    if (isToday) {
      ringClass = 'ring-2 ring-primary ring-offset-2 ring-offset-background';
    }

    if (isLastPeriodStart) {
      ringClass = 'ring-2 ring-red-500';
    }

    return `${bgClass} ${textClass} ${ringClass}`;
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h4 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty slots */}
        {emptySlots.map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        
        {/* Days */}
        {daysInMonth.map(date => {
          const cycleInfo = getCycleDayInfo(date);
          const isInMonth = isSameMonth(date, currentMonth);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick?.(date)}
              className={`
                aspect-square rounded-full flex items-center justify-center text-sm
                transition-all duration-200 hover:bg-muted
                ${isInMonth ? 'opacity-100' : 'opacity-30'}
                ${getDayClasses(date, cycleInfo)}
              `}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/40" />
          <span className="text-muted-foreground">Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-pink-500/30" />
          <span className="text-muted-foreground">Fertile</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500/40" />
          <span className="text-muted-foreground">Ovulation</span>
        </div>
      </div>
    </div>
  );
};
