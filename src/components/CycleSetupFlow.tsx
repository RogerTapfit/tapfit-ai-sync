import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { CycleCalendarView } from './CycleCalendarView';

interface CycleSetupFlowProps {
  onComplete: (startDate: Date, periodLength: number) => void;
  onCancel: () => void;
}

export const CycleSetupFlow = ({ onComplete, onCancel }: CycleSetupFlowProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const today = startOfDay(new Date());

  const handleDateClick = (date: Date) => {
    const clickedDate = startOfDay(date);
    
    // Don't allow future dates
    if (isAfter(clickedDate, today)) return;

    if (step === 1) {
      setPeriodStart(clickedDate);
      setPeriodEnd(null); // Reset end when changing start
    } else if (step === 2 && periodStart) {
      // End must be on or after start, and not in future
      if (!isBefore(clickedDate, periodStart)) {
        setPeriodEnd(clickedDate);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && periodStart) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setPeriodEnd(null);
    } else {
      onCancel();
    }
  };

  const handleSave = () => {
    if (periodStart && periodEnd) {
      const periodLength = differenceInDays(periodEnd, periodStart) + 1;
      onComplete(periodStart, periodLength);
    }
  };

  const periodLength = periodStart && periodEnd 
    ? differenceInDays(periodEnd, periodStart) + 1 
    : null;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step >= 1 ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
        }`}>
          {step > 1 ? <Check className="w-4 h-4" /> : '1'}
        </div>
        <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-red-500' : 'bg-muted'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step >= 2 ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
        }`}>
          2
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {step === 1 ? 'When did your last period START?' : 'When did your last period END?'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 1 
            ? 'Tap the first day of your last period' 
            : 'Tap the last day of your period'}
        </p>
      </div>

      {/* Selected Date Display */}
      {step === 1 && periodStart && (
        <div className="text-center p-3 bg-red-500/20 rounded-lg">
          <span className="text-sm text-red-200">
            Start: {format(periodStart, 'MMMM d, yyyy')}
          </span>
        </div>
      )}
      
      {step === 2 && (
        <div className="text-center p-3 bg-red-500/20 rounded-lg space-y-1">
          <div className="text-sm text-red-200">
            Start: {periodStart && format(periodStart, 'MMM d')}
            {periodEnd && ` → End: ${format(periodEnd, 'MMM d')}`}
          </div>
          {periodLength && (
            <div className="text-xs text-muted-foreground">
              Period length: {periodLength} day{periodLength !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <CycleCalendarView
        cycleDays={[]}
        onDateClick={handleDateClick}
        selectionMode={step === 1 ? 'start' : 'end'}
        selectedStart={periodStart || undefined}
        selectedEnd={periodEnd || undefined}
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        {step === 1 ? (
          <Button 
            onClick={handleNext}
            disabled={!periodStart}
            className="flex-1 bg-red-500 hover:bg-red-600"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button 
            onClick={handleSave}
            disabled={!periodEnd}
            className="flex-1 bg-red-500 hover:bg-red-600"
          >
            <Check className="w-4 h-4 mr-1" />
            Save & Start
          </Button>
        )}
      </div>
    </div>
  );
};
