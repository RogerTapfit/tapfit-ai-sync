import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRestaurantDiscovery } from '@/hooks/useRestaurantDiscovery';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, TrendingUp, Utensils, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export const RestaurantDiscovery = () => {
  const { popularMeals, popularRestaurants, loading } = useRestaurantDiscovery();

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-muted text-muted-foreground';
    const upperGrade = grade.toUpperCase();
    if (upperGrade === 'A') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (upperGrade === 'B') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (upperGrade === 'C') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (popularMeals.length === 0 && popularRestaurants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Restaurant Discovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Utensils className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No restaurant meals found yet</p>
            <p className="text-sm text-muted-foreground">
              Follow users or share restaurant meals to see popular dishes from your network
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Restaurant Discovery
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Popular meals and restaurants from your network
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="meals" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Popular Meals
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Restaurants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="space-y-4">
            {popularMeals.map((meal, index) => (
              <motion.div
                key={`${meal.restaurant_name}-${meal.meal_name}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {meal.recent_thumbnail_url && (
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={meal.recent_thumbnail_url}
                            alt={meal.meal_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold truncate">{meal.meal_name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {meal.restaurant_name}
                            </p>
                          </div>
                          {meal.avg_health_grade && (
                            <Badge variant="outline" className={getGradeColor(meal.avg_health_grade)}>
                              Grade {meal.avg_health_grade}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{meal.avg_calories} cal</span>
                          <span>{meal.avg_protein}g protein</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {meal.share_count} {meal.share_count === 1 ? 'person' : 'people'} ordered
                            </span>
                          </div>
                          <div className="flex -space-x-2">
                            {meal.user_profiles.slice(0, 3).map((profile, idx) => (
                              <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {profile.username?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-4">
            {popularRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.restaurant_name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg mb-1">{restaurant.restaurant_name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {restaurant.total_shares} shares
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {restaurant.unique_users} users
                          </span>
                        </div>
                      </div>
                      {restaurant.avg_health_grade && (
                        <Badge variant="outline" className={getGradeColor(restaurant.avg_health_grade)}>
                          Grade {restaurant.avg_health_grade}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Popular Dishes:</p>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.popular_meals.map((meal) => (
                          <Badge key={meal.meal_name} variant="secondary" className="text-xs">
                            {meal.meal_name} ({meal.share_count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
