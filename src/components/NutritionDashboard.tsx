import React, { useState } from 'react';
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
  Flame,
  Apple,
  Activity,
  Zap
} from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import NutritionGoalsSetup from './NutritionGoalsSetup';
import FoodPhotoAnalyzer from './FoodPhotoAnalyzer';
import WeeklyNutritionCalendar from './WeeklyNutritionCalendar';
import MetabolismTracker from './MetabolismTracker';
import FoodEntryList from './FoodEntryList';

const NutritionDashboard = () => {
  const { nutritionGoals, dailySummary, metabolismReadings, refreshData } = useNutrition();
  const [activeTab, setActiveTab] = useState('overview');
  const [showFoodEntries, setShowFoodEntries] = useState(false);

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
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calories Today</p>
                <p className="text-2xl font-bold">
                  {dailySummary?.total_calories || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {nutritionGoals?.daily_calories || 0}
                </p>
              </div>
              <Apple className="h-8 w-8 text-green-500" />
            </div>
            {nutritionGoals && (
              <Progress value={calorieProgress} className="mt-3" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Goal</p>
                <p className="text-lg font-semibold">
                  {nutritionGoals?.goal_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Set'}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setShowFoodEntries(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meals Logged</p>
                <p className="text-2xl font-bold">
                  {dailySummary?.meals_count || 0}
                </p>
                <p className="text-sm text-muted-foreground">today - click to view</p>
              </div>
              <Utensils className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Metabolism</p>
                <p className="text-lg font-semibold capitalize">
                  {latestReading?.reading_type?.replace('_', ' ') || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {latestReading ? 'Latest reading' : 'No data'}
                </p>
              </div>
              {latestReading && getMetabolismIcon(latestReading.reading_type)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macros Progress */}
      {nutritionGoals && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Macros Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm text-muted-foreground">
                    {dailySummary?.total_protein?.toFixed(0) || 0}g / {nutritionGoals.protein_grams}g
                  </span>
                </div>
                <Progress value={proteinProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Carbs</span>
                  <span className="text-sm text-muted-foreground">
                    {dailySummary?.total_carbs?.toFixed(0) || 0}g / {nutritionGoals.carbs_grams}g
                  </span>
                </div>
                <Progress value={carbProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fat</span>
                  <span className="text-sm text-muted-foreground">
                    {dailySummary?.total_fat?.toFixed(0) || 0}g / {nutritionGoals.fat_grams}g
                  </span>
                </div>
                <Progress value={fatProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-green-500" />
            See Food
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="metabolism" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Metabolism
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Meals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Recent Meals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailySummary?.meals_count === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No meals logged today. Use the camera to add your first meal!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total meals logged:</span>
                        <span className="font-medium">{dailySummary?.meals_count || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metabolism Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Metabolism Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestReading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getMetabolismIcon(latestReading.reading_type)}
                      <div>
                        <p className="font-medium capitalize">
                          {latestReading.reading_type.replace('_', ' ')} Mode
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(latestReading.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {latestReading.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommendations:</p>
                        <div className="space-y-1">
                          {latestReading.recommendations.map((rec, index) => (
                            <Badge key={index} variant="outline" className="mr-2">
                              {rec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No metabolism readings yet. Connect your Lumen device or add manual readings.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="camera" className="space-y-4">
          <FoodPhotoAnalyzer onDataChange={handleDataRefresh} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <NutritionGoalsSetup />
        </TabsContent>

        <TabsContent value="metabolism" className="space-y-4">
          <MetabolismTracker />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <WeeklyNutritionCalendar />
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