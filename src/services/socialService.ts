import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_profile_public: boolean;
  share_workout_stats: boolean;
  tap_coins_balance: number;
}

export interface SocialStats {
  follower_count: number;
  following_count: number;
  workout_count: number;
  total_exercises: number;
}

export interface UserWorkoutStats {
  total_calories_burned: number;
  total_workouts: number;
  total_workout_minutes: number;
  total_exercises: number;
}

export interface UserWithStats extends UserProfile {
  workout_stats?: UserWorkoutStats | null;
}

export interface FollowRelationship {
  isFollowing: boolean;
  isFollower: boolean;
  isBlocked: boolean;
}

class SocialService {
  /**
   * Search users by username
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, is_profile_public, share_workout_stats, tap_coins_balance')
      .ilike('username', `%${query}%`)
      .eq('is_profile_public', true)
      .not('username', 'is', null)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, is_profile_public, share_workout_stats, tap_coins_balance')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user profile by username
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, is_profile_public, share_workout_stats, tap_coins_balance')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }

    return data;
  }

  /**
   * Get social stats for a user
   */
  async getSocialStats(userId: string): Promise<SocialStats> {
    const { data, error } = await supabase.rpc('get_user_social_stats', {
      user_uuid: userId
    });

    if (error || !data) {
      console.error('Error fetching social stats:', error);
      return {
        follower_count: 0,
        following_count: 0,
        workout_count: 0,
        total_exercises: 0
      };
    }

    return {
      follower_count: (data as any).follower_count || 0,
      following_count: (data as any).following_count || 0,
      workout_count: (data as any).workout_count || 0,
      total_exercises: (data as any).total_exercises || 0
    };
  }

  /**
   * Follow a user
   */
  async followUser(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
        status: 'active'
      });

    if (error) {
      console.error('Error following user:', error);
      return false;
    }

    return true;
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }

    return true;
  }

  /**
   * Check relationship status between current user and target user
   */
  async getRelationshipStatus(targetUserId: string): Promise<FollowRelationship> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isFollowing: false, isFollower: false, isBlocked: false };
    }

    const { data: isFollowingData } = await supabase.rpc('is_following', {
      follower_uuid: user.id,
      following_uuid: targetUserId
    });

    const { data: isFollowerData } = await supabase.rpc('is_following', {
      follower_uuid: targetUserId,
      following_uuid: user.id
    });

    const { data: blockedData } = await supabase
      .from('user_follows')
      .select('status')
      .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
      .or(`follower_id.eq.${targetUserId},following_id.eq.${targetUserId}`)
      .eq('status', 'blocked')
      .single();

    return {
      isFollowing: isFollowingData || false,
      isFollower: isFollowerData || false,
      isBlocked: !!blockedData
    };
  }

  /**
   * Get workout stats for a user
   */
  async getUserWorkoutStats(userId: string): Promise<UserWorkoutStats | null> {
    // Get last 30 days of activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('daily_activity_summary')
      .select('total_calories_burned, workouts_completed, total_workout_minutes, total_exercises')
      .eq('user_id', userId)
      .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching workout stats:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        total_calories_burned: 0,
        total_workouts: 0,
        total_workout_minutes: 0,
        total_exercises: 0
      };
    }

    // Aggregate the data
    return data.reduce((acc, day) => ({
      total_calories_burned: acc.total_calories_burned + (day.total_calories_burned || 0),
      total_workouts: acc.total_workouts + (day.workouts_completed || 0),
      total_workout_minutes: acc.total_workout_minutes + (day.total_workout_minutes || 0),
      total_exercises: acc.total_exercises + (day.total_exercises || 0)
    }), {
      total_calories_burned: 0,
      total_workouts: 0,
      total_workout_minutes: 0,
      total_exercises: 0
    });
  }

  /**
   * Get followers list for a user with workout stats
   */
  async getFollowers(userId: string, limit: number = 50): Promise<UserWithStats[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        created_at,
        profiles!user_follows_follower_id_fkey(
          id, username, full_name, avatar_url, bio, is_profile_public, share_workout_stats, tap_coins_balance
        )
      `)
      .eq('following_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching followers:', error);
      return [];
    }

    if (!data) return [];

    // Fetch workout stats for each follower
    const followersWithStats = await Promise.all(
      data.map(async (follow: any) => {
        const profile = follow.profiles;
        if (!profile) return null;

        let workout_stats = null;
        if (profile.share_workout_stats) {
          workout_stats = await this.getUserWorkoutStats(profile.id);
        }

        return {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          is_profile_public: profile.is_profile_public,
          share_workout_stats: profile.share_workout_stats,
          tap_coins_balance: profile.tap_coins_balance || 0,
          workout_stats
        } as UserWithStats;
      })
    );

    return followersWithStats.filter((f): f is UserWithStats => f !== null);
  }

  /**
   * Get following list for a user with workout stats
   */
  async getFollowing(userId: string, limit: number = 50): Promise<UserWithStats[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        created_at,
        profiles!user_follows_following_id_fkey(
          id, username, full_name, avatar_url, bio, is_profile_public, share_workout_stats, tap_coins_balance
        )
      `)
      .eq('follower_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching following:', error);
      return [];
    }

    if (!data) return [];

    // Fetch workout stats for each user being followed
    const followingWithStats = await Promise.all(
      data.map(async (follow: any) => {
        const profile = follow.profiles;
        if (!profile) return null;

        let workout_stats = null;
        if (profile.share_workout_stats) {
          workout_stats = await this.getUserWorkoutStats(profile.id);
        }

        return {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          is_profile_public: profile.is_profile_public,
          share_workout_stats: profile.share_workout_stats,
          tap_coins_balance: profile.tap_coins_balance || 0,
          workout_stats
        } as UserWithStats;
      })
    );

    return followingWithStats.filter((f): f is UserWithStats => f !== null);
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    // If data exists, username is taken
    // If no data, username is available
    return !data;
  }

  /**
   * Validate username format
   */
  validateUsernameFormat(username: string): { valid: boolean; error?: string } {
    if (!username) return { valid: false, error: 'Username is required' };
    if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
    if (username.length > 30) return { valid: false, error: 'Username must be less than 30 characters' };
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    return { valid: true };
  }

  /**
   * Update user's profile
   */
  async updateProfile(updates: { 
    username?: string; 
    bio?: string;
    is_profile_public?: boolean;
    share_workout_stats?: boolean;
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate username format if provided
    if (updates.username) {
      const validation = this.validateUsernameFormat(updates.username);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        throw new Error('Username already taken');
      }
      throw error;
    }

    return true;
  }
}

export const socialService = new SocialService();
