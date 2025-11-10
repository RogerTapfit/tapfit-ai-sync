import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Utensils, Clock, Calendar } from 'lucide-react';
import { ActivityFeedItem } from '@/services/activityFeedService';
import { getGradeColor, getGradeBgColor } from '@/utils/healthGrading';

interface MealActivityDetailProps {
  activity: ActivityFeedItem;
  isOpen: boolean;
  onClose: () => void;
}

export const MealActivityDetail = ({ activity, isOpen, onClose }: MealActivityDetailProps) => {
  const data = activity.activity_data;
  const isFoodEntry = activity.activity_type === 'meal_logged' || activity.activity_type === 'restaurant_meal';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Meal Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {/* Photo */}
            {(data.photo_url || data.thumbnail_url) && (
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={data.photo_url || data.thumbnail_url}
                  alt="Meal"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meal Info */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{data.meal_name || data.drink_type}</h3>
              
              {data.restaurant && (
                <Badge variant="secondary">🍴 {data.restaurant}</Badge>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(data.logged_time || activity.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(data.logged_time || activity.created_at)}
                </div>
              </div>
            </div>

            {/* Nutrition Summary */}
            {isFoodEntry && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-bold text-xl">{data.calories}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-bold text-xl">{data.protein_g?.toFixed(0)}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-bold text-xl">{data.carbs_g?.toFixed(0)}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-bold text-xl">{data.fat_g?.toFixed(0)}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                </div>

                {/* Health Grade */}
                {data.health_grade && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getGradeBgColor(data.health_grade)}`}>
                        <span className={`text-xl font-bold ${getGradeColor(data.health_grade)}`}>
                          {data.health_grade}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Award className="h-4 w-4" />
                          Health Grade
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Score: {data.grade_score || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Food Items */}
                {data.food_items && data.food_items.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Food Items:</h4>
                    <div className="space-y-2">
                      {data.food_items.map((item: any, index: number) => (
                        <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                          <div className="font-medium">{item.name}</div>
                          {item.quantity && (
                            <div className="text-muted-foreground">{item.quantity}</div>
                          )}
                          <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{item.calories} cal</span>
                            <span>•</span>
                            <span>{item.protein}g protein</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Alcohol Details */}
            {!isFoodEntry && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{data.drink_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alcohol Content:</span>
                  <span className="font-medium">{data.alcohol_content}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{data.quantity} serving(s)</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {data.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground">{data.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
