import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardType = 'coins' | 'workouts' | 'calories';
export type LeaderboardPeriod = 'all_time' | 'month' | 'week';

interface LeaderboardUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  tap_coins_balance: number;
  total_workouts: number;
  total_calories: number;
  rank: number;
}

export const useLeaderboard = (type: LeaderboardType, period: LeaderboardPeriod = 'all_time', limit: number = 50) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [type, period, limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Calculate date range based on period
      let dateFilter = '';
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString().split('T')[0];
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString().split('T')[0];
      }

      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, tap_coins_balance')
        .not('username', 'is', null)
        .eq('is_profile_public', true);

      if (profileError) throw profileError;
      if (!profiles) return;

      // Fetch activity data for each user
      const usersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          let query = supabase
            .from('daily_activity_summary')
            .select('total_calories_burned, workouts_completed')
            .eq('user_id', profile.id);

          if (dateFilter) {
            query = query.gte('activity_date', dateFilter);
          }

          const { data: activity } = await query;

          const total_workouts = activity?.reduce((sum, day) => sum + (day.workouts_completed || 0), 0) || 0;
          const total_calories = activity?.reduce((sum, day) => sum + (day.total_calories_burned || 0), 0) || 0;

          return {
            id: profile.id,
            username: profile.username || 'Unknown',
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            tap_coins_balance: profile.tap_coins_balance || 0,
            total_workouts,
            total_calories,
            rank: 0
          };
        })
      );

      // Sort based on leaderboard type
      let sortedUsers: LeaderboardUser[];
      if (type === 'coins') {
        sortedUsers = usersWithStats.sort((a, b) => b.tap_coins_balance - a.tap_coins_balance);
      } else if (type === 'workouts') {
        sortedUsers = usersWithStats.sort((a, b) => b.total_workouts - a.total_workouts);
      } else {
        sortedUsers = usersWithStats.sort((a, b) => b.total_calories - a.total_calories);
      }

      // Assign ranks and take top N
      const rankedUsers = sortedUsers
        .map((user, index) => ({ ...user, rank: index + 1 }))
        .slice(0, limit);

      setUsers(rankedUsers);

      // Find current user's rank
      if (currentUserId) {
        const userIndex = sortedUsers.findIndex(u => u.id === currentUserId);
        setMyRank(userIndex >= 0 ? userIndex + 1 : null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, myRank, refetch: fetchLeaderboard };
};
