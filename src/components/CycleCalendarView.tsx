import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isAfter, startOfDay, isBefore } from 'date-fns';

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
  selectionMode?: 'none' | 'start' | 'end';
  selectedStart?: Date;
  selectedEnd?: Date;
}

export const CycleCalendarView = ({ 
  cycleDays, 
  onDateClick,
  lastPeriodStart,
  onMonthChange,
  selectionMode = 'none',
  selectedStart,
  selectedEnd
}: CycleCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

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

  const isInSelectedRange = (date: Date): boolean => {
    if (!selectedStart || !selectedEnd) return false;
    const d = startOfDay(date);
    return !isBefore(d, selectedStart) && !isAfter(d, selectedEnd);
  };

  const getDayClasses = (date: Date, cycleInfo?: CycleDay) => {
    const dateStart = startOfDay(date);
    const isToday = isSameDay(dateStart, today);
    const isLastPeriodStart = lastPeriodStart && isSameDay(dateStart, lastPeriodStart);
    const isFutureDate = isAfter(dateStart, today);
    const isSelectedStart = selectedStart && isSameDay(dateStart, selectedStart);
    const isSelectedEnd = selectedEnd && isSameDay(dateStart, selectedEnd);
    const isInRange = isInSelectedRange(dateStart);
    
    let bgClass = 'bg-transparent';
    let textClass = 'text-foreground';
    let ringClass = '';

    // Selection mode styling takes priority
    if (selectionMode !== 'none') {
      if (isSelectedStart || isSelectedEnd) {
        bgClass = 'bg-red-500';
        textClass = 'text-white';
      } else if (isInRange) {
        bgClass = 'bg-red-500/30';
        textClass = 'text-red-200';
      } else if (isFutureDate) {
        textClass = 'text-muted-foreground/40';
      }
    } else {
      // Normal cycle day styling
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
    }

    if (isToday) {
      ringClass = 'ring-2 ring-primary ring-offset-2 ring-offset-background';
    }

    if (isLastPeriodStart && selectionMode === 'none') {
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
          const dateStart = startOfDay(date);
          const isFutureDate = isAfter(dateStart, today);
          const isDisabled = selectionMode !== 'none' && isFutureDate;
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => !isDisabled && onDateClick?.(date)}
              disabled={isDisabled}
              className={`
                aspect-square rounded-full flex items-center justify-center text-sm
                transition-all duration-200 
                ${isDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted cursor-pointer'}
                ${isInMonth ? 'opacity-100' : 'opacity-30'}
                ${getDayClasses(date, cycleInfo)}
              `}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend - only show when not in selection mode */}
      {selectionMode === 'none' && (
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
      )}
    </div>
  );
};