import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Copy } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { useMealPlans, MealPlan } from '@/hooks/useMealPlans';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

interface MealCalendarSchedulerProps {
  onAddMeal: (date: string, mealType: string) => void;
}

export function MealCalendarScheduler({ onAddMeal }: MealCalendarSchedulerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { weeklyPlans, loading, deleteMealPlan, markAsCompleted, copyDayPlan } = useMealPlans(currentWeekStart);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const getDayTotals = (dateStr: string) => {
    const plans = weeklyPlans[dateStr] || [];
    return plans.reduce(
      (acc, plan) => ({
        calories: acc.calories + (plan.planned_calories || 0),
        protein: acc.protein + (plan.planned_protein || 0),
      }),
      { calories: 0, protein: 0 }
    );
  };

  const getMealForSlot = (dateStr: string, mealType: string): MealPlan | undefined => {
    const plans = weeklyPlans[dateStr] || [];
    return plans.find(p => p.meal_type === mealType);
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-semibold text-lg">
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </h3>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const totals = getDayTotals(dateStr);

          return (
            <div
              key={dateStr}
              className={cn(
                'text-center cursor-pointer transition-colors p-2 rounded-lg',
                isToday && 'bg-primary/10',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedDate(dateStr)}
            >
              <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
              <p className={cn('font-semibold', isToday && 'text-primary')}>{format(day, 'd')}</p>
              {totals.calories > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{totals.calories} cal</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">
            {format(new Date(selectedDate), 'EEEE, MMMM d')}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextDay = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
              copyDayPlan(selectedDate, nextDay);
            }}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy to Next Day
          </Button>
        </div>

        <div className="space-y-3">
          {MEAL_TYPES.map((mealType) => {
            const meal = getMealForSlot(selectedDate, mealType);

            return (
              <div
                key={mealType}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl">{MEAL_EMOJIS[mealType]}</span>
                
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{mealType}</p>
                  
                  <AnimatePresence mode="wait">
                    {meal ? (
                      <motion.div
                        key={meal.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2 mt-1"
                      >
                        <p className="text-sm text-foreground">
                          {meal.recipe?.name || meal.custom_meal_name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {meal.planned_calories} cal
                        </Badge>
                        {meal.status === 'completed' && (
                          <Badge className="bg-green-500/20 text-green-500 text-xs">
                            Done
                          </Badge>
                        )}
                      </motion.div>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-muted-foreground"
                      >
                        No meal planned
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {meal ? (
                  <div className="flex gap-1">
                    {meal.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-500 hover:text-green-600"
                        onClick={() => markAsCompleted(meal.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMealPlan(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onAddMeal(selectedDate, mealType)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Daily totals */}
        {(() => {
          const totals = getDayTotals(selectedDate);
          if (totals.calories === 0) return null;
          
          return (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Total:</span>
                <span className="font-medium">
                  {totals.calories} cal • {totals.protein}g protein
                </span>
              </div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
