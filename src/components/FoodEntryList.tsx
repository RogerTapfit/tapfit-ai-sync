import React, { useState, useEffect } from 'react';
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
  Award,
  Loader2,
  Filter,
  History
} from 'lucide-react';
import { MealShareButton } from '@/components/social/MealShareButton';
import { mealSharingService } from '@/services/mealSharingService';
import { FoodEntry, AlcoholEntry, useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { calculateHealthGrade, getGradeColor, getGradeBgColor } from '@/utils/healthGrading';
import { getBestThumbnailUrl } from '@/utils/photoUtils';
import { getCurrentLocalDate } from '@/utils/dateUtils';

interface FoodEntryListProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => void;
}

const FoodEntryList = ({ isOpen, onClose, onDataChange }: FoodEntryListProps) => {
  const { deleteFoodEntry, loading, getAllFoodEntries, getAllAlcoholEntries } = useNutrition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allFoodEntries, setAllFoodEntries] = useState<FoodEntry[]>([]);
  const [allAlcoholEntries, setAllAlcoholEntries] = useState<AlcoholEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [sharedEntries, setSharedEntries] = useState<Map<string, string>>(new Map());

  // Load all entries when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAllEntries();
      checkSharedEntries();
    }
  }, [isOpen]);

  const checkSharedEntries = async () => {
    const shared = new Map<string, string>();
    
    // Check all food entries
    for (const entry of allFoodEntries) {
      const activityId = await mealSharingService.isEntryShared(entry.id, 'food');
      if (activityId) {
        shared.set(`food-${entry.id}`, activityId);
      }
    }
    
    // Check all alcohol entries
    for (const entry of allAlcoholEntries) {
      const activityId = await mealSharingService.isEntryShared(entry.id, 'alcohol');
      if (activityId) {
        shared.set(`alcohol-${entry.id}`, activityId);
      }
    }
    
    setSharedEntries(shared);
  };

  const loadAllEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const [foodEntries, alcoholEntries] = await Promise.all([
        getAllFoodEntries(),
        getAllAlcoholEntries()
      ]);
      
      console.log('Loaded all food entries:', foodEntries.length);
      console.log('Loaded all alcohol entries:', alcoholEntries.length);
      
      setAllFoodEntries(foodEntries);
      setAllAlcoholEntries(alcoholEntries);
    } catch (error) {
      console.error('Error loading all entries:', error);
      toast.error('Failed to load food history');
    } finally {
      setIsLoadingEntries(false);
    }
  };

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
      snack: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      beverage: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      // Alcohol types
      beer: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      wine: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
      spirits: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
      cocktail: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      alcohol: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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

  const getGradeDescription = (entry: FoodEntry) => {
    // Use stored grade if available, otherwise calculate it
    if (entry.health_grade) {
      // For stored grades, generate a simple description based on the grade
      const grade = entry.health_grade;
      if (grade.startsWith('A')) {
        return { pros: ["Excellent nutritional balance", "Supports fitness goals"], cons: [] };
      } else if (grade.startsWith('B')) {
        return { pros: ["Good nutrition"], cons: ["Could use more vegetables"] };
      } else if (grade.startsWith('C')) {
        return { pros: ["Some nutritional value"], cons: ["Room for improvement"] };
      } else {
        return { pros: [], cons: ["High in processed foods", "Consider healthier alternatives"] };
      }
    }
    
    // Calculate detailed grade for entries that don't have one stored
    const gradeResult = calculateHealthGrade(
      entry.food_items,
      entry.total_calories,
      entry.total_protein,
      entry.total_carbs,
      entry.total_fat
    );
    return { pros: gradeResult.pros, cons: gradeResult.cons };
  };

  // Check if an entry appears to be alcohol but was saved as food (incorrect classification)
  const isIncorrectlyClassifiedAlcohol = (entry: FoodEntry) => {
    const foodNames = entry.food_items.map(item => item.name.toLowerCase()).join(' ');
    
    // First check for obvious food items that should never be flagged as alcohol
    const foodExclusionPatterns = [
      /\b(cheez|cheese|crackers|chips|snack|cookie|bread|cereal|original|flavor|cheddar)\b/i
    ];
    
    if (foodExclusionPatterns.some(pattern => pattern.test(foodNames))) {
      return false;
    }
    
    // Use word-boundary regex for alcohol detection to avoid false positives
    const alcoholPatterns = [
      /\b(stella\s+artois|heineken|budweiser|corona|modelo)\b/i, // Beer brands
      /\b(beer|lager|ale|stout|pilsner)\b/i, // Beer types
      /\b(wine|merlot|cabernet|chardonnay|pinot)\b/i, // Wine
      /\b(vodka|whiskey|whisky|rum|tequila|bourbon|scotch)\b/i, // Spirits
      /\b(gin\s+and\s+tonic|gin\s+fizz)\b/i, // Gin cocktails (avoid plain "gin")
      /\b(alcohol|liquor|spirits|cocktail|martini|mojito)\b/i, // General alcohol terms
      /\d+%\s*(abv|alcohol|vol)/i // ABV indicators
    ];
    
    const hasAlcoholMatch = alcoholPatterns.some(pattern => pattern.test(foodNames));
    const isFoodMealType = ['breakfast', 'lunch', 'dinner', 'snack'].includes(entry.meal_type);
    
    return hasAlcoholMatch && isFoodMealType;
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this food entry?')) return;
    
    setDeletingId(entryId);
    try {
      await deleteFoodEntry(entryId);
      toast.success('Food entry deleted successfully');
      // Reload all entries after deletion
      await loadAllEntries();
      onDataChange?.();
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast.error('Error deleting food entry');
    } finally {
      setDeletingId(null);
    }
  };

  // Get today's date in local timezone
  const todayDate = getCurrentLocalDate();

  // Combine and sort all entries by date (newest first)
  const allCombinedEntries = [
    ...allFoodEntries.map(entry => ({ ...entry, type: 'food' as const })),
    ...allAlcoholEntries.map(entry => ({ ...entry, type: 'alcohol' as const }))
  ].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Filter entries based on view mode
  const filteredEntries = viewMode === 'today' 
    ? allCombinedEntries.filter(entry => {
        const entryDate = new Date(entry.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return entryDate === todayDate;
      })
    : allCombinedEntries;

  // Group entries by date for history view
  const groupedEntries = viewMode === 'history' 
    ? filteredEntries.reduce((groups, entry) => {
        const date = new Date(entry.created_at).toLocaleDateString('en-CA');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(entry);
        return groups;
      }, {} as Record<string, typeof filteredEntries>)
    : {};

  const totalEntries = allFoodEntries.length + allAlcoholEntries.length;
  const todayCount = allCombinedEntries.filter(entry => {
    const entryDate = new Date(entry.created_at).toLocaleDateString('en-CA');
    return entryDate === todayDate;
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="mr-2 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Utensils className="h-5 w-5 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {viewMode === 'today' ? `Today's Food Log (${todayCount} entries)` : `Food & Alcohol History (${totalEntries} entries)`}
            </span>
          </DialogTitle>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant={viewMode === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('today')}
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Today ({todayCount})
            </Button>
            <Button
              variant={viewMode === 'history' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('history')}
              className="flex items-center gap-1"
            >
              <History className="h-4 w-4" />
              All History ({totalEntries})
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          {isLoadingEntries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading food history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {viewMode === 'today' 
                        ? "No entries for today yet. Start by adding your first meal!" 
                        : "No food or alcohol entries yet. Start by adding your first meal!"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : viewMode === 'today' ? (
                // Today view - simple list
                filteredEntries.map((entry) => (
                entry.type === 'alcohol' ? (
                  // Alcohol Entry
                  <Card key={`alcohol-${entry.id}`} className="overflow-hidden border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Badge className={getMealTypeColor(entry.drink_type)}>
                            🍺 {entry.drink_type.charAt(0).toUpperCase() + entry.drink_type.slice(1)}
                          </Badge>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(entry.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h4 className="font-medium mb-2">Alcohol Details:</h4>
                        <div className="text-sm space-y-1">
                          <div><span className="font-medium">Type:</span> {entry.drink_type}</div>
                          <div><span className="font-medium">Alcohol Content:</span> {entry.alcohol_content}%</div>
                          <div><span className="font-medium">Quantity:</span> {entry.quantity} serving{entry.quantity !== 1 ? 's' : ''}</div>
                          {entry.logged_time && <div><span className="font-medium">Time:</span> {entry.logged_time}</div>}
                        </div>
                      </div>

                      {/* Display alcohol entry photo */}
                      {getBestThumbnailUrl(entry) && (
                        <div className="mb-3">
                          <img 
                            src={getBestThumbnailUrl(entry)} 
                            alt={`${entry.drink_type} photo`}
                            className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                            onError={(e) => {
                              console.warn('Failed to load alcohol photo:', getBestThumbnailUrl(entry));
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {entry.notes && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm break-words">
                          <strong>Notes:</strong> {entry.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  // Food Entry
                  <Card key={`food-${entry.id}`} className={`overflow-hidden ${isIncorrectlyClassifiedAlcohol(entry) ? 'border-red-300 bg-red-50/50' : ''}`}>
                    <CardContent className="p-0">
                      {isIncorrectlyClassifiedAlcohol(entry) && (
                        <div className="bg-red-100 border-b border-red-200 p-2 text-sm">
                          <span className="text-red-700 font-medium">⚠️ This alcohol item was incorrectly saved as food.</span>
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className="ml-2 text-red-600 hover:text-red-800 underline"
                          >
                            Delete and re-add correctly
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row">
                        {/* Food Photo */}
                        <div className="w-full h-48 sm:w-24 sm:h-24 bg-muted flex-shrink-0 flex items-center justify-center">
                          {(() => {
                            const photoUrl = getBestThumbnailUrl(entry);
                            
                            if (photoUrl) {
                              console.log(`[FoodEntryList] Displaying photo for entry ${entry.id}:`, photoUrl);
                            }
                            
                            return photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt="Food"
                                className="w-full h-full object-cover"
                                onError={async (e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  console.warn(`[FoodEntryList] Public URL failed for entry ${entry.id}. Retrying with signed URL...`);
                                  // Try storage paths first
                                  const storagePath = (entry as any).photo_storage_path || (entry as any).photo_storage_paths?.[0];
                                  if (storagePath) {
                                    const { FoodPhotoUploadService } = await import('@/services/foodPhotoUploadService');
                                    const signed = await FoodPhotoUploadService.getSignedUrl(storagePath, 60 * 60 * 6);
                                    if (signed) {
                                      img.src = signed;
                                      return;
                                    }
                                  }
                                  // Try to extract path from the current URL if possible
                                  const match = img.src.match(/\/storage\/v1\/object\/(?:public|sign)\/food-photos\/(.+)$/i);
                                  if (match?.[1]) {
                                    const { FoodPhotoUploadService } = await import('@/services/foodPhotoUploadService');
                                    const signed = await FoodPhotoUploadService.getSignedUrl(match[1], 60 * 60 * 6);
                                    if (signed) {
                                      img.src = signed;
                                      return;
                                    }
                                  }
                                  // Hide broken image icon
                                  img.style.display = 'none';
                                }}
                              />
                            ) : (
                              (() => {
                                console.warn('[FoodEntryList] No photo found for entry', entry.id, {
                                  photo_url: (entry as any).photo_url,
                                  photo_urls: (entry as any).photo_urls,
                                  thumbnail_url: (entry as any).thumbnail_url,
                                  thumbnail_urls: (entry as any).thumbnail_urls,
                                  photo_storage_path: (entry as any).photo_storage_path,
                                  photo_storage_paths: (entry as any).photo_storage_paths,
                                });
                                return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
                              })()
                            );
                          })()}
                        </div>

                        {/* Main Content - Same as before for food entries */}
                        <div className="flex-1 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <Badge className={getMealTypeColor(entry.meal_type)}>
                                {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}
                              </Badge>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(entry.created_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(entry.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 self-end sm:self-auto">
                              <MealShareButton
                                entryId={entry.id}
                                entryType="food"
                                entryData={entry}
                                isShared={sharedEntries.has(`food-${entry.id}`)}
                                activityId={sharedEntries.get(`food-${entry.id}`)}
                                onShareChange={checkSharedEntries}
                              />
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
                            <div className="space-y-2">
                              {entry.food_items.map((item, index) => (
                                <div key={index} className="text-sm text-muted-foreground">
                                  <div className="font-medium text-foreground break-words">{item.name}</div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {item.quantity && <span className="text-xs bg-muted px-2 py-1 rounded break-words">{item.quantity}</span>}
                                    <span className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                                      {item.calories} cal, {item.protein}g protein
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Nutritional Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm mb-3">
                            <div className="text-center p-2 bg-muted/30 rounded">
                              <div className="font-bold text-lg">{entry.total_calories}</div>
                              <div className="text-muted-foreground text-xs">Calories</div>
                            </div>
                            <div className="text-center p-2 bg-muted/30 rounded">
                              <div className="font-bold text-lg">{entry.total_protein.toFixed(1)}g</div>
                              <div className="text-muted-foreground text-xs">Protein</div>
                            </div>
                            <div className="text-center p-2 bg-muted/30 rounded">
                              <div className="font-bold text-lg">{entry.total_carbs.toFixed(1)}g</div>
                              <div className="text-muted-foreground text-xs">Carbs</div>
                            </div>
                            <div className="text-center p-2 bg-muted/30 rounded">
                              <div className="font-bold text-lg">{entry.total_fat.toFixed(1)}g</div>
                              <div className="text-muted-foreground text-xs">Fat</div>
                            </div>
                          </div>

                          {/* Grade Description */}
                          {(() => {
                            const description = getGradeDescription(entry);
                            if (description.pros.length > 0 || description.cons.length > 0) {
                              return (
                                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                                  <div className="flex flex-wrap items-center gap-2 font-medium text-muted-foreground">
                                    <Award className="h-4 w-4 flex-shrink-0" />
                                    <span>Grade Analysis</span>
                                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full border ${getGradeBgColor(getDisplayGrade(entry))}`}>
                                      <span className={`text-xs font-bold ${getGradeColor(getDisplayGrade(entry))}`}>
                                        {getDisplayGrade(entry)}
                                      </span>
                                    </div>
                                  </div>
                                  {description.pros.length > 0 && (
                                    <div className="break-words">
                                      <span className="text-stats-exercises font-medium">✓ Pros: </span>
                                      <span className="text-muted-foreground">{description.pros.join(", ")}</span>
                                    </div>
                                  )}
                                  {description.cons.length > 0 && (
                                    <div className="break-words">
                                      <span className="text-destructive font-medium">⚠ Cons: </span>
                                      <span className="text-muted-foreground">{description.cons.join(", ")}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Notes */}
                          {entry.notes && (
                            <div className="mt-3 p-2 bg-muted rounded text-sm break-words">
                              <strong>Notes:</strong> {entry.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
                ))
              ) : (
                // History view - grouped by date
                Object.entries(groupedEntries)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([date, entries]) => (
                    <div key={date} className="space-y-3">
                      {/* Date Header */}
                      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b pb-2 z-10">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          <Badge variant="secondary" className="ml-2">
                            {entries.length} entries
                          </Badge>
                        </h3>
                      </div>
                      
                      {/* Entries for this date */}
                      <div className="space-y-3 ml-2">
                        {entries.map((entry) => (
                          entry.type === 'alcohol' ? (
                            // Alcohol Entry
                            <Card key={`alcohol-${entry.id}`} className="overflow-hidden border-amber-200">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <Badge className={getMealTypeColor(entry.drink_type)}>
                                      🍺 {entry.drink_type.charAt(0).toUpperCase() + entry.drink_type.slice(1)}
                                    </Badge>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(entry.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <h4 className="font-medium mb-2">Alcohol Details:</h4>
                                  <div className="text-sm space-y-1">
                                    <div><span className="font-medium">Type:</span> {entry.drink_type}</div>
                                    <div><span className="font-medium">Alcohol Content:</span> {entry.alcohol_content}%</div>
                                    <div><span className="font-medium">Quantity:</span> {entry.quantity} serving{entry.quantity !== 1 ? 's' : ''}</div>
                                    {entry.logged_time && <div><span className="font-medium">Time:</span> {entry.logged_time}</div>}
                                  </div>
                                </div>

                                {/* Display alcohol entry photo */}
                                {getBestThumbnailUrl(entry) && (
                                  <div className="mb-3">
                                    <img 
                                      src={getBestThumbnailUrl(entry)} 
                                      alt={`${entry.drink_type} photo`}
                                      className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                                      onError={(e) => {
                                        console.warn('Failed to load alcohol photo:', getBestThumbnailUrl(entry));
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}

                                {entry.notes && (
                                  <div className="mt-3 p-2 bg-muted rounded text-sm break-words">
                                    <strong>Notes:</strong> {entry.notes}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ) : (
                            // Food Entry (same as before but without full date display)
                            <Card key={`food-${entry.id}`} className={`overflow-hidden ${isIncorrectlyClassifiedAlcohol(entry) ? 'border-red-300 bg-red-50/50' : ''}`}>
                              <CardContent className="p-0">
                                {isIncorrectlyClassifiedAlcohol(entry) && (
                                  <div className="bg-red-100 border-b border-red-200 p-2 text-sm">
                                    <span className="text-red-700 font-medium">⚠️ This alcohol item was incorrectly saved as food.</span>
                                    <button 
                                      onClick={() => handleDelete(entry.id)}
                                      className="ml-2 text-red-600 hover:text-red-800 underline"
                                    >
                                      Delete and re-add correctly
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-col sm:flex-row">
                                  {/* Food Photo */}
                                  <div className="w-full h-48 sm:w-24 sm:h-24 bg-muted flex-shrink-0 flex items-center justify-center">
                                    {(() => {
                                      const photoUrl = getBestThumbnailUrl(entry);
                                      
                                      return photoUrl ? (
                                        <img 
                                          src={photoUrl} 
                                          alt="Food"
                                          className="w-full h-full object-cover"
                                          onError={async (e) => {
                                            const img = e.currentTarget as HTMLImageElement;
                                            const storagePath = (entry as any).photo_storage_path || (entry as any).photo_storage_paths?.[0];
                                            if (storagePath) {
                                              const { FoodPhotoUploadService } = await import('@/services/foodPhotoUploadService');
                                              const signed = await FoodPhotoUploadService.getSignedUrl(storagePath, 60 * 60 * 6);
                                              if (signed) {
                                                img.src = signed;
                                                return;
                                              }
                                            }
                                            img.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                      );
                                    })()}
                                  </div>

                                  {/* Main Content */}
                                  <div className="flex-1 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <Badge className={getMealTypeColor(entry.meal_type)}>
                                          {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}
                                        </Badge>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(entry.created_at)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-1 self-end sm:self-auto">
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
                                      <div className="space-y-2">
                                        {entry.food_items.map((item, index) => (
                                          <div key={index} className="text-sm text-muted-foreground">
                                            <div className="font-medium text-foreground break-words">{item.name}</div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {item.quantity && <span className="text-xs bg-muted px-2 py-1 rounded break-words">{item.quantity}</span>}
                                              <span className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                                                {item.calories} cal, {item.protein}g protein
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Nutritional Summary */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-sm">
                                      <div className="bg-muted rounded p-2 text-center">
                                        <div className="font-medium">{entry.total_calories}</div>
                                        <div className="text-xs text-muted-foreground">Calories</div>
                                      </div>
                                      <div className="bg-muted rounded p-2 text-center">
                                        <div className="font-medium">{entry.total_protein}g</div>
                                        <div className="text-xs text-muted-foreground">Protein</div>
                                      </div>
                                      <div className="bg-muted rounded p-2 text-center">
                                        <div className="font-medium">{entry.total_carbs}g</div>
                                        <div className="text-xs text-muted-foreground">Carbs</div>
                                      </div>
                                      <div className="bg-muted rounded p-2 text-center">
                                        <div className="font-medium">{entry.total_fat}g</div>
                                        <div className="text-xs text-muted-foreground">Fat</div>
                                      </div>
                                    </div>

                                    {/* Health Grade Analysis */}
                                    <div className="mb-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Award className="h-4 w-4" />
                                        <span className="font-medium">Health Grade</span>
                                        <Badge 
                                          className={`${getGradeBgColor(getDisplayGrade(entry))} ${getGradeColor(getDisplayGrade(entry))} font-bold`}
                                        >
                                          {getDisplayGrade(entry)}
                                        </Badge>
                                      </div>
                                      
                                      <div className="text-sm space-y-2">
                                        {(() => {
                                          const gradeDetails = getGradeDescription(entry);
                                          return (
                                            <>
                                              {gradeDetails.pros.length > 0 && (
                                                <div>
                                                  <div className="font-medium text-green-700 dark:text-green-400">✓ Strengths:</div>
                                                  <ul className="text-muted-foreground ml-2">
                                                    {gradeDetails.pros.map((pro, index) => (
                                                      <li key={index} className="break-words">• {pro}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              {gradeDetails.cons.length > 0 && (
                                                <div>
                                                  <div className="font-medium text-orange-700 dark:text-orange-400">⚠ Areas for improvement:</div>
                                                  <ul className="text-muted-foreground ml-2">
                                                    {gradeDetails.cons.map((con, index) => (
                                                      <li key={index} className="break-words">• {con}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>

                                    {entry.notes && (
                                      <div className="mt-3 p-2 bg-muted rounded text-sm break-words">
                                        <strong>Notes:</strong> {entry.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FoodEntryList;