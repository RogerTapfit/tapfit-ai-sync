import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { FASTING_MILESTONES, getProtocolById } from '@/data/fastingProtocols';
import { getFastingXP } from '@/config/gamerRanks';

export interface FastingSession {
  id: string;
  user_id: string;
  fast_type: string;
  started_at: string;
  target_end_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'broken' | 'cancelled';
  target_hours: number;
  actual_hours: number | null;
  allow_liquids: boolean;
  allow_zero_cal: boolean;
  break_reason: string | null;
  notes: string | null;
  coins_earned: number;
  created_at: string;
}

export interface FastingGoals {
  id: string;
  user_id: string;
  preferred_protocol: string;
  weekly_target_fasts: number;
  preferred_eating_window_start: string;
  preferred_eating_window_end: string;
  notifications_enabled: boolean;
}

export interface FastingProgress {
  elapsedHours: number;
  elapsedMinutes: number;
  remainingHours: number;
  remainingMinutes: number;
  percentComplete: number;
  currentMilestone: typeof FASTING_MILESTONES[0] | null;
  nextMilestone: typeof FASTING_MILESTONES[0] | null;
  allMilestonesReached: typeof FASTING_MILESTONES[0][];
}

export const useFastingTracking = () => {
  const { user, isGuest } = useAuth();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [pastFasts, setPastFasts] = useState<FastingSession[]>([]);
  const [goals, setGoals] = useState<FastingGoals | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active fast and history
  const fetchFastingData = useCallback(async () => {
    if (!user?.id || isGuest) {
      setIsLoading(false);
      return;
    }

    try {
      // Get active fast
      const { data: activeData, error: activeError } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError) throw activeError;
      setActiveFast(activeData as FastingSession | null);

      // Get past fasts (last 30)
      const { data: pastData, error: pastError } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(30);

      if (pastError) throw pastError;
      setPastFasts((pastData || []) as FastingSession[]);

      // Get goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('fasting_goals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (goalsError && goalsError.code !== 'PGRST116') throw goalsError;
      setGoals(goalsData as FastingGoals | null);

    } catch (error) {
      console.error('Error fetching fasting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isGuest]);

  useEffect(() => {
    fetchFastingData();
  }, [fetchFastingData]);

  // Start a new fast
  const startFast = async (protocolId: string, customHours?: number): Promise<boolean> => {
    if (!user?.id || isGuest) {
      toast.error('Please sign in to track fasting');
      return false;
    }

    const protocol = getProtocolById(protocolId);
    const targetHours = customHours || protocol?.fastHours || 16;
    
    const startedAt = new Date();
    const targetEndAt = new Date(startedAt.getTime() + targetHours * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase
        .from('fasting_sessions')
        .insert({
          user_id: user.id,
          fast_type: protocolId,
          started_at: startedAt.toISOString(),
          target_end_at: targetEndAt.toISOString(),
          target_hours: targetHours,
          status: 'active',
          allow_liquids: true,
          allow_zero_cal: true
        })
        .select()
        .single();

      if (error) throw error;

      setActiveFast(data as FastingSession);
      toast.success(`${targetHours}h fast started! 💪`);
      return true;
    } catch (error) {
      console.error('Error starting fast:', error);
      toast.error('Failed to start fast');
      return false;
    }
  };

  // End the current fast
  const endFast = async (broken: boolean = false, breakReason?: string): Promise<number> => {
    if (!activeFast || !user?.id) return 0;

    const endedAt = new Date();
    const startedAt = new Date(activeFast.started_at);
    const actualHours = (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60);

    try {
      // Update the session
      const { error: updateError } = await supabase
        .from('fasting_sessions')
        .update({
          ended_at: endedAt.toISOString(),
          status: broken ? 'broken' : 'completed',
          actual_hours: Math.round(actualHours * 100) / 100,
          break_reason: breakReason || null
        })
        .eq('id', activeFast.id);

      if (updateError) throw updateError;

      // Award coins via RPC
      const { data: coinsAwarded, error: coinsError } = await supabase
        .rpc('award_fasting_coins', {
          _user_id: user.id,
          _session_id: activeFast.id,
          _actual_hours: actualHours,
          _target_hours: activeFast.target_hours
        });

      if (coinsError) {
        console.error('Error awarding coins:', coinsError);
      }

      const coins = coinsAwarded || 0;

      if (broken) {
        toast.info(`Fast ended early after ${Math.floor(actualHours)}h ${Math.round((actualHours % 1) * 60)}m. +${coins} coins`);
      } else {
        toast.success(`🎉 Fast completed! ${Math.floor(actualHours)}h - +${coins} coins`);
      }

      // Award XP for completing fast (scaled by duration)
      try {
        const xpAmount = getFastingXP(actualHours, activeFast.target_hours);
        const { data: xpResult } = await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_xp_amount: xpAmount,
          p_source: 'fasting'
        });
        if (xpResult) {
          window.dispatchEvent(new CustomEvent('xpAwarded', {
            detail: { amount: xpAmount, source: 'fasting', result: xpResult }
          }));
        }
      } catch (xpError) {
        console.error('Error awarding XP for fasting:', xpError);
      }

      // Trigger achievement check
      window.dispatchEvent(new CustomEvent('achievement:check'));

      setActiveFast(null);
      await fetchFastingData();
      return coins;
    } catch (error) {
      console.error('Error ending fast:', error);
      toast.error('Failed to end fast');
      return 0;
    }
  };

  // Cancel the current fast (no coins)
  const cancelFast = async (): Promise<void> => {
    if (!activeFast) return;

    try {
      const { error } = await supabase
        .from('fasting_sessions')
        .update({
          ended_at: new Date().toISOString(),
          status: 'cancelled',
          actual_hours: 0
        })
        .eq('id', activeFast.id);

      if (error) throw error;

      toast.info('Fast cancelled');
      setActiveFast(null);
    } catch (error) {
      console.error('Error cancelling fast:', error);
      toast.error('Failed to cancel fast');
    }
  };

  // Calculate progress for active fast
  const getProgress = useMemo((): FastingProgress | null => {
    if (!activeFast) return null;

    const now = new Date();
    const startedAt = new Date(activeFast.started_at);
    const targetEndAt = new Date(activeFast.target_end_at);

    const elapsedMs = now.getTime() - startedAt.getTime();
    const totalMs = targetEndAt.getTime() - startedAt.getTime();
    const remainingMs = Math.max(0, targetEndAt.getTime() - now.getTime());

    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const percentComplete = Math.min(100, (elapsedMs / totalMs) * 100);

    const totalElapsedHours = elapsedMs / (1000 * 60 * 60);
    
    // Find milestones
    const reachedMilestones = FASTING_MILESTONES.filter(m => m.hours <= totalElapsedHours);
    const currentMilestone = reachedMilestones[reachedMilestones.length - 1] || null;
    const nextMilestone = FASTING_MILESTONES.find(m => m.hours > totalElapsedHours) || null;

    return {
      elapsedHours,
      elapsedMinutes,
      remainingHours,
      remainingMinutes,
      percentComplete,
      currentMilestone,
      nextMilestone,
      allMilestonesReached: reachedMilestones
    };
  }, [activeFast]);

  // Get weekly stats
  const weeklyStats = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyFasts = pastFasts.filter(f => 
      new Date(f.started_at) >= oneWeekAgo && f.status === 'completed'
    );

    const totalHours = weeklyFasts.reduce((sum, f) => sum + (f.actual_hours || 0), 0);
    const completedCount = weeklyFasts.length;
    const avgHours = completedCount > 0 ? totalHours / completedCount : 0;

    return {
      completedCount,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round(avgHours * 10) / 10
    };
  }, [pastFasts]);

  // Update goals
  const updateGoals = async (updates: Partial<FastingGoals>): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('fasting_goals')
        .upsert({
          user_id: user.id,
          ...goals,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await fetchFastingData();
      toast.success('Fasting goals updated');
    } catch (error) {
      console.error('Error updating goals:', error);
      toast.error('Failed to update goals');
    }
  };

  return {
    activeFast,
    pastFasts,
    goals,
    isLoading,
    startFast,
    endFast,
    cancelFast,
    getProgress,
    weeklyStats,
    updateGoals,
    refetch: fetchFastingData
  };
};
