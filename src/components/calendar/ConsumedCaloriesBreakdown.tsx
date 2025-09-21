import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Apple, Coffee, UtensilsCrossed, Moon, Clock } from 'lucide-react';
import { FoodActivity } from '@/hooks/useCalendarData';

interface ConsumedCaloriesBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodEntries: FoodActivity[];
  totalCalories: number;
  date: Date;
}

export const ConsumedCaloriesBreakdown: React.FC<ConsumedCaloriesBreakdownProps> = ({
  open,
  onOpenChange,
  foodEntries,
  totalCalories,
  date,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return <Coffee className="h-4 w-4 text-amber-500" />;
      case 'lunch':
        return <UtensilsCrossed className="h-4 w-4 text-orange-500" />;
      case 'dinner':
        return <Apple className="h-4 w-4 text-green-500" />;
      case 'snack':
        return <Moon className="h-4 w-4 text-blue-500" />;
      default:
        return <Apple className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'lunch':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'dinner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'snack':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getHealthGradeColor = (grade?: string) => {
    if (!grade) return 'text-muted-foreground';
    switch (grade.toUpperCase()) {
      case 'A':
        return 'text-green-600 dark:text-green-400';
      case 'B':
        return 'text-blue-600 dark:text-blue-400';
      case 'C':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'D':
        return 'text-orange-600 dark:text-orange-400';
      case 'F':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const mealTypeTotals = foodEntries.reduce((acc, entry) => {
    const mealType = entry.mealType || 'other';
    acc[mealType] = (acc[mealType] || 0) + (entry.totalCalories || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-500" />
            Calories Consumed - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-4 bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalCalories}</div>
              <div className="text-sm text-muted-foreground">Total Calories Consumed</div>
              <div className="text-xs text-muted-foreground mt-1">
                {foodEntries.length} meal{foodEntries.length !== 1 ? 's' : ''} logged
              </div>
            </div>
          </Card>

          {/* Meal Type Breakdown */}
          {Object.keys(mealTypeTotals).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Meal Type Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(mealTypeTotals).map(([mealType, calories]) => (
                  <Card key={mealType} className="p-3 text-center">
                    <div className="flex items-center justify-center mb-2">
                      {getMealTypeIcon(mealType)}
                    </div>
                    <div className="font-semibold">{calories} cal</div>
                    <div className="text-xs text-muted-foreground capitalize">{mealType}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Food Entries */}
          {foodEntries.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Food Log</h3>
              <div className="space-y-3">
                {foodEntries.map((entry, index) => (
                  <Card key={index} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-4">
                      {entry.photoUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={entry.photoUrl}
                            alt="Food"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getMealTypeIcon(entry.mealType)}
                            <Badge 
                              variant="outline" 
                              className={getMealTypeColor(entry.mealType)}
                            >
                              {entry.mealType}
                            </Badge>
                            {entry.healthGrade && (
                              <Badge variant="outline" className={getHealthGradeColor(entry.healthGrade)}>
                                Grade {entry.healthGrade}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              {entry.totalCalories || 0} cal
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Food Items List */}
                        <div className="text-sm space-y-1">
                          <div className="text-muted-foreground">Food items logged for this meal</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <Apple className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Food Logged</h3>
              <p className="text-sm text-muted-foreground">
                No meals or snacks were logged for this day
              </p>
            </Card>
          )}

          {/* Nutritional Distribution */}
          {totalCalories > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Calorie Distribution by Meal</h4>
              <div className="space-y-2">
                {Object.entries(mealTypeTotals).map(([mealType, calories]) => (
                  <div key={mealType} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                    <span className="flex items-center gap-2 capitalize">
                      {getMealTypeIcon(mealType)}
                      {mealType}
                    </span>
                    <span className="font-medium">
                      {calories} cal ({Math.round((calories / totalCalories) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};