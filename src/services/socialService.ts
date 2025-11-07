import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_profile_public: boolean;
  share_workout_stats: boolean;
}

export interface SocialStats {
  follower_count: number;
  following_count: number;
  workout_count: number;
  total_exercises: number;
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
      .select('id, username, full_name, bio, avatar_url, is_profile_public, share_workout_stats')
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
      .select('id, username, full_name, bio, avatar_url, is_profile_public, share_workout_stats')
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
      .select('id, username, full_name, bio, avatar_url, is_profile_public, share_workout_stats')
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
   * Get followers list for a user
   */
  async getFollowers(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        created_at,
        profiles!user_follows_follower_id_fkey(
          id, username, full_name, avatar_url
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

    return data || [];
  }

  /**
   * Get following list for a user
   */
  async getFollowing(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        created_at,
        profiles!user_follows_following_id_fkey(
          id, username, full_name, avatar_url
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

    return data || [];
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
