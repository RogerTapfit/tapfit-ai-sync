import { supabase } from '@/integrations/supabase/client';
import { FoodEntry, AlcoholEntry } from '@/hooks/useNutrition';
import { ActivityFeedItem } from './activityFeedService';

export type MealShareVisibility = 'private' | 'followers' | 'public';

interface ShareMealParams {
  entryId: string;
  entryType: 'food' | 'alcohol';
  caption?: string;
  visibility?: MealShareVisibility;
}

class MealSharingService {
  async shareMealToFeed(params: ShareMealParams): Promise<ActivityFeedItem | null> {
    const { entryId, entryType, caption, visibility = 'followers' } = params;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's visibility preference if not specified
      const { data: profile } = await supabase
        .from('profiles')
        .select('workout_visibility')
        .eq('id', user.id)
        .single();

      const effectiveVisibility = visibility || profile?.workout_visibility || 'followers';

      // Fetch the entry data
      let entryData: FoodEntry | AlcoholEntry | null = null;
      let activityType: 'meal_logged' | 'restaurant_meal' | 'alcohol_logged' = 'meal_logged';

      if (entryType === 'food') {
        const { data } = await supabase
          .from('food_entries')
          .select('*')
          .eq('id', entryId)
          .single();
        
        entryData = data as unknown as FoodEntry;
        
        // Determine if it's a restaurant meal
        const hasRestaurant = entryData?.food_items?.some(item => 
          item.name?.toLowerCase().includes('restaurant') ||
          item.quantity?.toLowerCase().includes('restaurant')
        );
        activityType = hasRestaurant ? 'restaurant_meal' : 'meal_logged';
      } else {
        const { data } = await supabase
          .from('alcohol_entries')
          .select('*')
          .eq('id', entryId)
          .single();
        
        entryData = data as unknown as AlcoholEntry;
        activityType = 'alcohol_logged';
      }

      if (!entryData) {
        throw new Error('Entry not found');
      }

      // Build activity data based on entry type
      const activityData = this.buildActivityData(entryData, entryType, caption) as any;

      // Create activity feed entry
      const { data: activity, error: activityError } = await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          activity_data: activityData,
          reference_id: entryId
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Create meal share record
      const { error: shareError } = await supabase
        .from('meal_shares')
        .insert({
          user_id: user.id,
          activity_feed_id: activity.id,
          food_entry_id: entryType === 'food' ? entryId : null,
          alcohol_entry_id: entryType === 'alcohol' ? entryId : null,
          is_public: effectiveVisibility === 'public'
        });

      if (shareError) throw shareError;

      return activity as ActivityFeedItem;
    } catch (error) {
      console.error('Error sharing meal:', error);
      return null;
    }
  }

  async unshareMeal(activityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Delete meal share record (will cascade delete from activity_feed due to FK)
      const { error: shareError } = await supabase
        .from('meal_shares')
        .delete()
        .eq('activity_feed_id', activityId)
        .eq('user_id', user.id);

      if (shareError) throw shareError;

      // Delete activity feed entry
      const { error: activityError } = await supabase
        .from('activity_feed')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (activityError) throw activityError;

      return true;
    } catch (error) {
      console.error('Error unsharing meal:', error);
      return false;
    }
  }

  async getMealShare(activityId: string): Promise<(FoodEntry | AlcoholEntry) | null> {
    try {
      // Get meal share record
      const { data: share } = await supabase
        .from('meal_shares')
        .select('*')
        .eq('activity_feed_id', activityId)
        .single();

      if (!share) return null;

      // Fetch the actual entry
      if (share.food_entry_id) {
        const { data } = await supabase
          .from('food_entries')
          .select('*')
          .eq('id', share.food_entry_id)
          .single();
        return data as unknown as FoodEntry;
      } else if (share.alcohol_entry_id) {
        const { data } = await supabase
          .from('alcohol_entries')
          .select('*')
          .eq('id', share.alcohol_entry_id)
          .single();
        return data as unknown as AlcoholEntry;
      }

      return null;
    } catch (error) {
      console.error('Error getting meal share:', error);
      return null;
    }
  }

  async canUserViewMealShare(activityId: string, viewerId?: string): Promise<boolean> {
    try {
      const { data: share } = await supabase
        .from('meal_shares')
        .select(`
          *,
          profiles:user_id (
            is_profile_public,
            workout_visibility
          )
        `)
        .eq('activity_feed_id', activityId)
        .single();

      if (!share) return false;

      const profile = (share as any).profiles;
      
      // Public shares are visible to everyone
      if (share.is_public && profile?.is_profile_public) {
        return true;
      }

      // Check if viewer is authenticated
      if (!viewerId) return false;

      // Owner can always view their own shares
      if (share.user_id === viewerId) return true;

      // Check follow relationship for followers-only visibility
      if (profile?.workout_visibility === 'followers') {
        const { data: follow } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', viewerId)
          .eq('following_id', share.user_id)
          .eq('status', 'active')
          .single();

        return !!follow;
      }

      return false;
    } catch (error) {
      console.error('Error checking meal share visibility:', error);
      return false;
    }
  }

  async isEntryShared(entryId: string, entryType: 'food' | 'alcohol'): Promise<string | null> {
    try {
      const columnName = entryType === 'food' ? 'food_entry_id' : 'alcohol_entry_id';
      
      const { data } = await supabase
        .from('meal_shares')
        .select('activity_feed_id')
        .eq(columnName, entryId)
        .single();

      return data?.activity_feed_id || null;
    } catch (error) {
      return null;
    }
  }

  private buildActivityData(
    entry: FoodEntry | AlcoholEntry,
    entryType: 'food' | 'alcohol',
    caption?: string
  ) {
    const baseData = {
      logged_time: entry.created_at,
      notes: caption || (entry as any).notes || '',
      photo_url: (entry as any).photo_url || (entry as any).photo_urls?.[0],
      thumbnail_url: (entry as any).thumbnail_url || (entry as any).thumbnail_urls?.[0]
    };

    if (entryType === 'food') {
      const foodEntry = entry as FoodEntry;
      const restaurantItem = foodEntry.food_items?.find(item =>
        item.name?.toLowerCase().includes('restaurant')
      );

      return {
        ...baseData,
        meal_type: foodEntry.meal_type,
        meal_name: foodEntry.food_items?.[0]?.name || 'Meal',
        restaurant: restaurantItem ? 'Restaurant' : undefined,
        calories: foodEntry.total_calories,
        protein_g: foodEntry.total_protein,
        carbs_g: foodEntry.total_carbs,
        fat_g: foodEntry.total_fat,
        health_grade: foodEntry.health_grade,
        grade_score: foodEntry.grade_score,
        food_items: foodEntry.food_items
      };
    } else {
      const alcoholEntry = entry as AlcoholEntry;
      return {
        ...baseData,
        drink_type: alcoholEntry.drink_type,
        alcohol_content: alcoholEntry.alcohol_content,
        quantity: alcoholEntry.quantity
      };
    }
  }
}

export const mealSharingService = new MealSharingService();
