import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Camera, Utensils, TrendingUp, Eye } from 'lucide-react';
import { useNutrition, FoodEntry } from '@/hooks/useNutrition';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { formatDateForDatabase } from '@/utils/dateUtils';

const WeeklyNutritionCalendar = () => {
  const { getWeeklyFoodEntries, nutritionGoals } = useNutrition();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyEntries, setWeeklyEntries] = useState<FoodEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate week start and end
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadWeekData();
  }, [currentWeek]);

  const loadWeekData = async () => {
    setLoading(true);
    try {
      const weekEnd = addDays(weekStart, 6);
      const entries = await getWeeklyFoodEntries(
        formatDateForDatabase(weekStart),
        formatDateForDatabase(weekEnd)
      );
      setWeeklyEntries(entries);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getEntriesForDay = (day: Date) => {
    const dayString = formatDateForDatabase(day);
    return weeklyEntries.filter(entry => entry.logged_date === dayString);
  };

  const getDaySummary = (day: Date) => {
    const entries = getEntriesForDay(day);
    const totalCalories = entries.reduce((sum, entry) => sum + entry.total_calories, 0);
    const totalProtein = entries.reduce((sum, entry) => sum + entry.total_protein, 0);
    const totalCarbs = entries.reduce((sum, entry) => sum + entry.total_carbs, 0);
    const totalFat = entries.reduce((sum, entry) => sum + entry.total_fat, 0);
    
    return {
      meals: entries.length,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      hasPhotos: entries.some(entry => entry.photo_url)
    };
  };

  const getCalorieProgress = (calories: number) => {
    if (!nutritionGoals) return 0;
    return Math.min((calories / nutritionGoals.daily_calories) * 100, 100);
  };

  const getMealTypeEmoji = (mealType: string) => {
    const emojis: { [key: string]: string } = {
      breakfast: '🌅',
      lunch: '☀️', 
      dinner: '🌙',
      snack: '🍎'
    };
    return emojis[mealType] || '🍽️';
  };

  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Nutrition Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goToPreviousWeek}>
                Previous
              </Button>
              <Button variant="outline" onClick={goToCurrentWeek}>
                This Week
              </Button>
              <Button variant="outline" onClick={goToNextWeek}>
                Next
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Week of {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const daySummary = getDaySummary(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isDayToday = isToday(day);
          
          return (
            <Card 
              key={day.toISOString()}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${isDayToday ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : day)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-2xl font-bold ${isDayToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </p>
                  {isDayToday && (
                    <Badge variant="default" className="text-xs">Today</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Meals Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      {daySummary.meals}
                    </span>
                    {daySummary.hasPhotos && (
                      <Camera className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>

                  {/* Calories */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Calories</span>
                      <span className="font-medium">{daySummary.calories}</span>
                    </div>
                    {nutritionGoals && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${getCalorieProgress(daySummary.calories)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick macros */}
                  <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    <div>P: {daySummary.protein.toFixed(0)}g</div>
                    <div>C: {daySummary.carbs.toFixed(0)}g</div>
                    <div>F: {daySummary.fat.toFixed(0)}g</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {format(selectedDay, 'EEEE, MMMM d')}
              {isToday(selectedDay) && <Badge variant="default">Today</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No meals logged for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Daily Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {getDaySummary(selectedDay).calories}
                        </p>
                        <p className="text-sm text-muted-foreground">Calories</p>
                        {nutritionGoals && (
                          <p className="text-xs text-muted-foreground">
                            Goal: {nutritionGoals.daily_calories}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {getDaySummary(selectedDay).protein.toFixed(1)}g
                        </p>
                        <p className="text-sm text-muted-foreground">Protein</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {getDaySummary(selectedDay).carbs.toFixed(1)}g
                        </p>
                        <p className="text-sm text-muted-foreground">Carbs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {getDaySummary(selectedDay).fat.toFixed(1)}g
                        </p>
                        <p className="text-sm text-muted-foreground">Fat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meal Entries */}
                <div className="space-y-3">
                  {selectedDayEntries.map((entry) => {
                    // Handle both new multiple photo format and legacy single photo format
                    const photoUrls = entry.photo_urls || (entry.photo_url ? [entry.photo_url] : []);
                    const thumbnailUrls = entry.thumbnail_urls || (entry.thumbnail_url ? [entry.thumbnail_url] : []);
                    const validPhotos = photoUrls.filter(url => url && !url.startsWith('data:'));
                    
                    return (
                      <Card key={entry.id} className="p-4">
                        <div className="flex items-start gap-4">
                          {validPhotos.length > 0 && (
                            <div className="flex gap-2">
                              {validPhotos.slice(0, 2).map((url, index) => (
                                <img 
                                  key={index}
                                  src={thumbnailUrls[index] || url} 
                                  alt={`Food photo ${index + 1}`}
                                  className="w-16 h-16 rounded-lg object-cover border"
                                />
                              ))}
                              {validPhotos.length > 2 && (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                                  +{validPhotos.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getMealTypeEmoji(entry.meal_type)}
                            </span>
                            <h4 className="font-medium capitalize">
                              {entry.meal_type}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.created_at), 'h:mm a')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Calories: </span>
                              <span className="font-medium">{entry.total_calories}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Protein: </span>
                              <span className="font-medium">{entry.total_protein.toFixed(1)}g</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Carbs: </span>
                              <span className="font-medium">{entry.total_carbs.toFixed(1)}g</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fat: </span>
                              <span className="font-medium">{entry.total_fat.toFixed(1)}g</span>
                            </div>
                          </div>
                          
                          {entry.food_items.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Items: </span>
                              {entry.food_items.map(item => item.name).join(', ')}
                            </div>
                          )}
                          
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              "{entry.notes}"
                            </p>
                          )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklyNutritionCalendar;