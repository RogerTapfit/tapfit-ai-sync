import { useState, useEffect } from 'react';
import { socialService, UserProfile, SocialStats } from '@/services/socialService';
import { toast } from 'sonner';

export const useSocialProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [profileData, statsData] = await Promise.all([
        socialService.getUserProfile(userId),
        socialService.getSocialStats(userId)
      ]);

      setProfile(profileData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching social profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { username?: string; bio?: string }) => {
    try {
      const success = await socialService.updateProfile(updates);
      if (success) {
        toast.success('Profile updated successfully');
        await fetchProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      return await socialService.checkUsernameAvailable(username);
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  return {
    profile,
    stats,
    loading,
    updateProfile,
    checkUsernameAvailable,
    refetch: fetchProfile
  };
};
