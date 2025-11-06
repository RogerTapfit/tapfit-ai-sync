import { useState, useEffect } from 'react';
import { socialService, FollowRelationship } from '@/services/socialService';
import { toast } from 'sonner';

export const useUserFollow = (targetUserId: string | undefined) => {
  const [relationship, setRelationship] = useState<FollowRelationship>({
    isFollowing: false,
    isFollower: false,
    isBlocked: false
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      fetchRelationship();
    }
  }, [targetUserId]);

  const fetchRelationship = async () => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      const status = await socialService.getRelationshipStatus(targetUserId);
      setRelationship(status);
    } catch (error) {
      console.error('Error fetching relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async () => {
    if (!targetUserId) return false;

    setActionLoading(true);
    try {
      const success = await socialService.followUser(targetUserId);
      if (success) {
        setRelationship(prev => ({ ...prev, isFollowing: true }));
        toast.success('Following user');
        return true;
      }
      toast.error('Failed to follow user');
      return false;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const unfollowUser = async () => {
    if (!targetUserId) return false;

    setActionLoading(true);
    try {
      const success = await socialService.unfollowUser(targetUserId);
      if (success) {
        setRelationship(prev => ({ ...prev, isFollowing: false }));
        toast.success('Unfollowed user');
        return true;
      }
      toast.error('Failed to unfollow user');
      return false;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (relationship.isFollowing) {
      return await unfollowUser();
    } else {
      return await followUser();
    }
  };

  return {
    ...relationship,
    loading,
    actionLoading,
    followUser,
    unfollowUser,
    toggleFollow,
    refetch: fetchRelationship
  };
};
