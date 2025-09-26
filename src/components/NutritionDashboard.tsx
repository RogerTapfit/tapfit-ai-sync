import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Utensils, 
  Camera, 
  Target,
  TrendingUp,
  Calendar,
  CalendarDays,
  Flame,
  Apple,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import NutritionGoalsSetup from './NutritionGoalsSetup';
import FoodPhotoAnalyzer from './FoodPhotoAnalyzer';
import WeeklyNutritionCalendar from './WeeklyNutritionCalendar';
import MetabolismTracker from './MetabolismTracker';
import FoodEntryList from './FoodEntryList';
import { FoodPhotoGallery } from './FoodPhotoGallery';
import { PhotoStorageMonitor } from './PhotoStorageMonitor';

const NutritionDashboard = () => {
  const { nutritionGoals, dailySummary, metabolismReadings, refreshData } = useNutrition();
  const [activeTab, setActiveTab] = useState('overview');
  const [showFoodEntries, setShowFoodEntries] = useState(false);

  // Debug: Log what date the daily summary is for
  useEffect(() => {
    console.log('🍎 NutritionDashboard dailySummary:', dailySummary);
    if (dailySummary) {
      console.log('🍎 Daily summary date:', dailySummary.summary_date);
      console.log('🍎 Current local date:', new Date().toLocaleDateString('sv-SE')); // YYYY-MM-DD format
    }
  }, [dailySummary]);

  useEffect(() => {
    try {
      if (localStorage.getItem('tapfit-open-food-entries') === 'true') {
        setShowFoodEntries(true);
        localStorage.removeItem('tapfit-open-food-entries');
      }
    } catch {}
  }, []);

  const handleDataRefresh = () => {
    refreshData();
  };

  // Calculate progress percentages
  const calorieProgress = nutritionGoals ? 
    Math.min((dailySummary?.total_calories || 0) / nutritionGoals.daily_calories * 100, 100) : 0;
  const proteinProgress = nutritionGoals ? 
    Math.min((dailySummary?.total_protein || 0) / nutritionGoals.protein_grams * 100, 100) : 0;
  const carbProgress = nutritionGoals ? 
    Math.min((dailySummary?.total_carbs || 0) / nutritionGoals.carbs_grams * 100, 100) : 0;
  const fatProgress = nutritionGoals ? 
    Math.min((dailySummary?.total_fat || 0) / nutritionGoals.fat_grams * 100, 100) : 0;

  const getGoalEmoji = (goalType: string) => {
    const goalEmojis: { [key: string]: string } = {
      'fat_loss': '🔥',
      'muscle_gain': '💪',
      'maintenance': '⚖️'
    };
    return goalEmojis[goalType] || '🎯';
  };

  const getMetabolismIcon = (readingType: string) => {
    switch (readingType) {
      case 'fat_burn': return <Flame className="h-5 w-5 text-orange-500" />;
      case 'carb_burn': return <Zap className="h-5 w-5 text-blue-500" />;
      default: return <Activity className="h-5 w-5 text-green-500" />;
    }
  };

  const latestReading = metabolismReadings[0];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Debug Info & Refresh Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {dailySummary ? (
            <span>Showing data for: <strong>{dailySummary.summary_date}</strong></span>
          ) : (
            <span>No nutrition data for today yet</span>
          )}
        </div>
        <button
          onClick={() => {
            console.log('🍎 Force refreshing nutrition data...');
            refreshData();
          }}
          className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Calories Today</p>
                <p className="text-2xl font-bold text-foreground">
                  {dailySummary?.total_calories || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  of {nutritionGoals?.daily_calories || 0} 
                  {dailySummary && ` (${dailySummary.summary_date})`}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20 shadow-glow">
                <Apple className="h-8 w-8 text-green-500" />
              </div>
            </div>
            {nutritionGoals && (
              <Progress value={calorieProgress} className="mt-4" />
            )}
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Goal</p>
                <p className="text-lg font-semibold text-foreground">
                  {nutritionGoals?.goal_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Set'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20 shadow-glow">
                <Target className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="glow-card cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:shadow-lg"
          onClick={() => setShowFoodEntries(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Meals Logged</p>
                <p className="text-2xl font-bold text-foreground">
                  {dailySummary?.meals_count || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  today {dailySummary && `(${dailySummary.summary_date})`} - click to view
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 shadow-glow">
                <Utensils className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Metabolism</p>
                <p className="text-lg font-semibold text-foreground capitalize">
                  {latestReading?.reading_type?.replace('_', ' ') || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestReading ? 'Latest reading' : 'No data'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 shadow-glow">
                {latestReading ? getMetabolismIcon(latestReading.reading_type) : (
                  <Activity className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macros Progress */}
      {nutritionGoals && (
        <Card className="glow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Macros Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Protein</span>
                  <span className="text-sm text-muted-foreground">
                    {dailySummary?.total_protein?.toFixed(0) || 0}g / {nutritionGoals.protein_grams}g
                  </span>
                </div>
                <Progress value={proteinProgress} className="h-3" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Carbs</span>
                  <span className="text-sm text-muted-foreground">
                    {dailySummary?.total_carbs?.toFixed(0) || 0}g / {nutritionGoals.carbs_grams}g
                  </span>
                </div>
                <Progress value={carbProgress} className="h-3" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Fat</span>
                  <span className="text-sm text-muted-foreground">
                    {dailySummary?.total_fat?.toFixed(0) || 0}g / {nutritionGoals.fat_grams}g
                  </span>
                </div>
                <Progress value={fatProgress} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="metabolism" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Metabolism
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <FoodPhotoAnalyzer onDataChange={handleDataRefresh} />
        </TabsContent>

        <TabsContent value="calendar">
          <WeeklyNutritionCalendar />
        </TabsContent>

        <TabsContent value="photos">
          <div className="space-y-4">
            <PhotoStorageMonitor />
            <FoodPhotoGallery />
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <NutritionGoalsSetup />
        </TabsContent>

        <TabsContent value="metabolism">
          <MetabolismTracker />
        </TabsContent>
      </Tabs>

      {/* Food Entry List Modal */}
      <FoodEntryList 
        isOpen={showFoodEntries}
        onClose={() => setShowFoodEntries(false)}
        onDataChange={handleDataRefresh}
      />
    </div>
  );
};

export default NutritionDashboard;