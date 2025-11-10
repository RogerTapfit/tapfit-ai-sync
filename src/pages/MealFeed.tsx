import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityFeedItem } from '@/components/social/ActivityFeedItem';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Filter, UtensilsCrossed, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';

type MealType = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'restaurant_meal' | 'alcohol_logged';
type HealthGrade = 'all' | 'A' | 'B' | 'C' | 'D' | 'F';

export default function MealFeed() {
  const navigate = useNavigate();
  const { activities, loading } = useActivityFeed(50);
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType>('all');
  const [healthGradeFilter, setHealthGradeFilter] = useState<HealthGrade>('all');

  // Filter only meal-related activities
  const mealActivities = activities.filter(activity => 
    ['meal_logged', 'restaurant_meal', 'alcohol_logged'].includes(activity.activity_type)
  );

  // Apply filters
  const filteredActivities = mealActivities.filter(activity => {
    // Filter by activity type (meal type)
    if (mealTypeFilter !== 'all') {
      if (mealTypeFilter === 'restaurant_meal' || mealTypeFilter === 'alcohol_logged') {
        if (activity.activity_type !== mealTypeFilter) return false;
      } else {
        // Filter by meal_type in activity_data
        const mealType = (activity.activity_data as any)?.meal_type;
        if (mealType !== mealTypeFilter) return false;
      }
    }

    // Filter by health grade
    if (healthGradeFilter !== 'all') {
      const healthGrade = (activity.activity_data as any)?.health_grade;
      if (!healthGrade || healthGrade.toUpperCase() !== healthGradeFilter) return false;
    }

    return true;
  });

  const getFilterCount = () => {
    let count = 0;
    if (mealTypeFilter !== 'all') count++;
    if (healthGradeFilter !== 'all') count++;
    return count;
  };

  return (
    <>
      <SEO 
        title="Meal Feed - TapFit" 
        description="See what your network is eating and discover healthy meal ideas"
        canonicalPath="/meal-feed"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background via-purple-500/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl pb-20">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 pt-6"
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-4 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8 bg-card border border-border">
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    Meal Feed
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  See what your network is eating and get meal inspiration
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </div>
                  {getFilterCount() > 0 && (
                    <Badge variant="secondary">
                      {getFilterCount()} active
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meal Type</label>
                    <Select value={mealTypeFilter} onValueChange={(value) => setMealTypeFilter(value as MealType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Meals</SelectItem>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snacks</SelectItem>
                        <SelectItem value="restaurant_meal">Restaurant Meals</SelectItem>
                        <SelectItem value="alcohol_logged">Alcohol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Health Grade</label>
                    <Select value={healthGradeFilter} onValueChange={(value) => setHealthGradeFilter(value as HealthGrade)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="A">Grade A</SelectItem>
                        <SelectItem value="B">Grade B</SelectItem>
                        <SelectItem value="C">Grade C</SelectItem>
                        <SelectItem value="D">Grade D</SelectItem>
                        <SelectItem value="F">Grade F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {getFilterCount() > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMealTypeFilter('all');
                      setHealthGradeFilter('all');
                    }}
                    className="mt-4 w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading && filteredActivities.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-32 w-full mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No meals found</h3>
                    <p className="text-muted-foreground mb-4">
                      {getFilterCount() > 0 
                        ? 'Try adjusting your filters or follow more users to see their meals'
                        : 'Follow users to see their meal posts here'
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => navigate('/social')}>
                        Find Users
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/food-scanner')}>
                        Log a Meal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <ActivityFeedItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
