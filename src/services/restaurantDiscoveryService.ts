import { supabase } from '@/integrations/supabase/client';

export interface PopularRestaurantMeal {
  restaurant_name: string;
  meal_name: string;
  share_count: number;
  avg_health_grade: string | null;
  avg_calories: number;
  avg_protein: number;
  recent_photo_url: string | null;
  recent_thumbnail_url: string | null;
  user_profiles: Array<{
    username: string | null;
    avatar_url: string | null;
  }>;
}

export interface PopularRestaurant {
  restaurant_name: string;
  total_shares: number;
  unique_users: number;
  avg_health_grade: string | null;
  popular_meals: Array<{
    meal_name: string;
    share_count: number;
  }>;
}

class RestaurantDiscoveryService {
  async getPopularRestaurantMeals(limit: number = 10): Promise<PopularRestaurantMeal[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get users that the current user follows
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'active');

      const followingIds = following?.map(f => f.following_id) || [];
      
      // Include current user in the network
      const networkIds = [...followingIds, user.id];

      if (networkIds.length === 0) return [];

      // Fetch restaurant meal activities from the network
      const { data: activities } = await supabase
        .from('activity_feed')
        .select('*, profiles:user_id(username, avatar_url)')
        .in('user_id', networkIds)
        .eq('activity_type', 'restaurant_meal')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!activities || activities.length === 0) return [];

      // Aggregate by restaurant and meal
      const mealMap = new Map<string, {
        restaurant_name: string;
        meal_name: string;
        shares: Array<{
          health_grade: string | null;
          calories: number;
          protein: number;
          photo_url: string | null;
          thumbnail_url: string | null;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
        }>;
      }>();

      activities.forEach(activity => {
        const data = activity.activity_data as any;
        const restaurant = data?.restaurant || 'Unknown Restaurant';
        const meal = data?.meal_name || 'Unknown Meal';
        const key = `${restaurant}|||${meal}`;

        if (!mealMap.has(key)) {
          mealMap.set(key, {
            restaurant_name: restaurant,
            meal_name: meal,
            shares: []
          });
        }

        const profile = (activity as any).profiles;
        mealMap.get(key)!.shares.push({
          health_grade: data?.health_grade,
          calories: data?.calories || 0,
          protein: data?.protein_g || 0,
          photo_url: data?.photo_url,
          thumbnail_url: data?.thumbnail_url,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
          created_at: activity.created_at
        });
      });

      // Convert to array and calculate aggregates
      const popularMeals: PopularRestaurantMeal[] = Array.from(mealMap.entries())
        .map(([key, value]) => {
          const shares = value.shares;
          const avgCalories = shares.reduce((sum, s) => sum + s.calories, 0) / shares.length;
          const avgProtein = shares.reduce((sum, s) => sum + s.protein, 0) / shares.length;
          
          // Get most common health grade
          const gradeCount = new Map<string, number>();
          shares.forEach(s => {
            if (s.health_grade) {
              gradeCount.set(s.health_grade, (gradeCount.get(s.health_grade) || 0) + 1);
            }
          });
          const avgHealthGrade = gradeCount.size > 0 
            ? Array.from(gradeCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
            : null;

          // Get most recent photo
          const sortedShares = shares.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const recentPhoto = sortedShares.find(s => s.photo_url || s.thumbnail_url);

          return {
            restaurant_name: value.restaurant_name,
            meal_name: value.meal_name,
            share_count: shares.length,
            avg_health_grade: avgHealthGrade,
            avg_calories: Math.round(avgCalories),
            avg_protein: Math.round(avgProtein),
            recent_photo_url: recentPhoto?.photo_url || null,
            recent_thumbnail_url: recentPhoto?.thumbnail_url || null,
            user_profiles: shares.slice(0, 5).map(s => ({
              username: s.username,
              avatar_url: s.avatar_url
            }))
          };
        })
        .sort((a, b) => b.share_count - a.share_count)
        .slice(0, limit);

      return popularMeals;
    } catch (error) {
      console.error('Error fetching popular restaurant meals:', error);
      return [];
    }
  }

  async getPopularRestaurants(limit: number = 10): Promise<PopularRestaurant[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get users that the current user follows
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'active');

      const followingIds = following?.map(f => f.following_id) || [];
      const networkIds = [...followingIds, user.id];

      if (networkIds.length === 0) return [];

      // Fetch restaurant activities
      const { data: activities } = await supabase
        .from('activity_feed')
        .select('*')
        .in('user_id', networkIds)
        .eq('activity_type', 'restaurant_meal')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!activities || activities.length === 0) return [];

      // Aggregate by restaurant
      const restaurantMap = new Map<string, {
        shares: Array<{
          meal_name: string;
          health_grade: string | null;
          user_id: string;
        }>;
      }>();

      activities.forEach(activity => {
        const data = activity.activity_data as any;
        const restaurant = data?.restaurant || 'Unknown Restaurant';

        if (!restaurantMap.has(restaurant)) {
          restaurantMap.set(restaurant, { shares: [] });
        }

        restaurantMap.get(restaurant)!.shares.push({
          meal_name: data?.meal_name || 'Unknown Meal',
          health_grade: data?.health_grade,
          user_id: activity.user_id
        });
      });

      // Convert to array and calculate aggregates
      const popularRestaurants: PopularRestaurant[] = Array.from(restaurantMap.entries())
        .map(([restaurant, data]) => {
          const shares = data.shares;
          const uniqueUsers = new Set(shares.map(s => s.user_id)).size;
          
          // Get most common health grade
          const gradeCount = new Map<string, number>();
          shares.forEach(s => {
            if (s.health_grade) {
              gradeCount.set(s.health_grade, (gradeCount.get(s.health_grade) || 0) + 1);
            }
          });
          const avgHealthGrade = gradeCount.size > 0 
            ? Array.from(gradeCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
            : null;

          // Get popular meals
          const mealCount = new Map<string, number>();
          shares.forEach(s => {
            mealCount.set(s.meal_name, (mealCount.get(s.meal_name) || 0) + 1);
          });
          const popularMeals = Array.from(mealCount.entries())
            .map(([meal_name, share_count]) => ({ meal_name, share_count }))
            .sort((a, b) => b.share_count - a.share_count)
            .slice(0, 3);

          return {
            restaurant_name: restaurant,
            total_shares: shares.length,
            unique_users: uniqueUsers,
            avg_health_grade: avgHealthGrade,
            popular_meals: popularMeals
          };
        })
        .sort((a, b) => b.total_shares - a.total_shares)
        .slice(0, limit);

      return popularRestaurants;
    } catch (error) {
      console.error('Error fetching popular restaurants:', error);
      return [];
    }
  }
}

export const restaurantDiscoveryService = new RestaurantDiscoveryService();
