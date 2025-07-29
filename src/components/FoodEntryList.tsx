import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Calendar, 
  Utensils, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  ChevronLeft,
  Award
} from 'lucide-react';
import { FoodEntry, useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { calculateHealthGrade, getGradeColor, getGradeBgColor } from '@/utils/healthGrading';

interface FoodEntryListProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => void;
}

const FoodEntryList = ({ isOpen, onClose, onDataChange }: FoodEntryListProps) => {
  const { foodEntries, deleteFoodEntry, loading } = useNutrition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
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

  const getMealTypeColor = (mealType: string) => {
    const colors = {
      breakfast: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      lunch: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      dinner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      snack: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };
    return colors[mealType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDisplayGrade = (entry: FoodEntry) => {
    // Use stored grade if available, otherwise calculate it
    if (entry.health_grade) {
      return entry.health_grade;
    }
    
    // Calculate grade for entries that don't have one stored
    const gradeResult = calculateHealthGrade(
      entry.food_items,
      entry.total_calories,
      entry.total_protein,
      entry.total_carbs,
      entry.total_fat
    );
    return gradeResult.grade;
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this food entry?')) return;
    
    setDeletingId(entryId);
    try {
      await deleteFoodEntry(entryId);
      toast.success('Food entry deleted successfully');
      onDataChange?.();
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast.error('Error deleting food entry');
    } finally {
      setDeletingId(null);
    }
  };

  // Sort entries by date (newest first)
  const sortedEntries = [...foodEntries].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Utensils className="h-5 w-5" />
            Food Entry History ({foodEntries.length} entries)
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {sortedEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No food entries yet. Start by adding your first meal!
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Food Photo */}
                      <div className="w-24 h-24 bg-muted flex-shrink-0 flex items-center justify-center">
                        {entry.photo_url ? (
                          <img 
                            src={entry.photo_url} 
                            alt="Food"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getMealTypeColor(entry.meal_type)}>
                              {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.created_at)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTime(entry.created_at)}
                            </div>
                            {/* Health Grade */}
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${getGradeBgColor(getDisplayGrade(entry))}`}>
                              <span className={`text-sm font-bold ${getGradeColor(getDisplayGrade(entry))}`}>
                                {getDisplayGrade(entry)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingId === entry.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Food Items */}
                        <div className="mb-3">
                          <h4 className="font-medium mb-2">Food Items:</h4>
                          <div className="grid gap-1">
                            {entry.food_items.map((item, index) => (
                              <div key={index} className="text-sm text-muted-foreground">
                                <span className="font-medium">{item.name}</span>
                                {item.quantity && <span> - {item.quantity}</span>}
                                <span className="ml-2">
                                  ({item.calories} cal, {item.protein}g protein)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Nutritional Summary */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-lg">{entry.total_calories}</div>
                            <div className="text-muted-foreground">Calories</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg">{entry.total_protein.toFixed(1)}g</div>
                            <div className="text-muted-foreground">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg">{entry.total_carbs.toFixed(1)}g</div>
                            <div className="text-muted-foreground">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg">{entry.total_fat.toFixed(1)}g</div>
                            <div className="text-muted-foreground">Fat</div>
                          </div>
                        </div>

                        {/* Notes */}
                        {entry.notes && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <strong>Notes:</strong> {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FoodEntryList;