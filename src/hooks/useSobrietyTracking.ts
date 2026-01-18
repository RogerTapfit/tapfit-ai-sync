import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { getLocalDateString } from '@/utils/dateUtils';

export interface SobrietyJourney {
  id: string;
  startDate: Date;
  targetDays: number;
  isActive: boolean;
  substanceType: string;
  notes: string | null;
  endDate: Date | null;
  reasonEnded: string | null;
  createdAt: Date;
}

export interface SobrietyCheckin {
  id: string;
  checkinDate: Date;
  dayNumber: number;
  coinsAwarded: number;
  feeling: string | null;
  notes: string | null;
}

export interface SobrietyProgress {
  currentDay: number;
  targetDays: number;
  percentComplete: number;
  daysRemaining: number;
  totalCoinsEarned: number;
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
  checkedInToday: boolean;
}

const MILESTONES = [7, 14, 30, 60, 90];

export const useSobrietyTracking = () => {
  const { user, isGuest } = useAuth();
  const [activeJourney, setActiveJourney] = useState<SobrietyJourney | null>(null);
  const [checkins, setCheckins] = useState<SobrietyCheckin[]>([]);
  const [pastJourneys, setPastJourneys] = useState<SobrietyJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveJourney = useCallback(async () => {
    if (!user || isGuest) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch active journey
      const { data: journeyData, error: journeyError } = await supabase
        .from('sobriety_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (journeyError) throw journeyError;

      if (journeyData) {
        const journey: SobrietyJourney = {
          id: journeyData.id,
          startDate: new Date(journeyData.start_date),
          targetDays: journeyData.target_days,
          isActive: journeyData.is_active,
          substanceType: journeyData.substance_type || 'general',
          notes: journeyData.notes,
          endDate: journeyData.end_date ? new Date(journeyData.end_date) : null,
          reasonEnded: journeyData.reason_ended,
          createdAt: new Date(journeyData.created_at),
        };
        setActiveJourney(journey);

        // Fetch checkins for this journey
        const { data: checkinData, error: checkinError } = await supabase
          .from('sobriety_daily_checkins')
          .select('*')
          .eq('sobriety_id', journeyData.id)
          .order('checkin_date', { ascending: false });

        if (checkinError) throw checkinError;

        if (checkinData) {
          setCheckins(checkinData.map(c => ({
            id: c.id,
            checkinDate: new Date(c.checkin_date),
            dayNumber: c.day_number,
            coinsAwarded: c.coins_awarded,
            feeling: c.feeling,
            notes: c.notes,
          })));
        }
      } else {
        setActiveJourney(null);
        setCheckins([]);
      }

      // Fetch past journeys
      const { data: pastData, error: pastError } = await supabase
        .from('sobriety_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (pastError) throw pastError;

      if (pastData) {
        setPastJourneys(pastData.map(j => ({
          id: j.id,
          startDate: new Date(j.start_date),
          targetDays: j.target_days,
          isActive: j.is_active,
          substanceType: j.substance_type || 'general',
          notes: j.notes,
          endDate: j.end_date ? new Date(j.end_date) : null,
          reasonEnded: j.reason_ended,
          createdAt: new Date(j.created_at),
        })));
      }
    } catch (error) {
      console.error('Error fetching sobriety data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    fetchActiveJourney();
  }, [fetchActiveJourney]);

  const startJourney = async (
    targetDays: number,
    substanceType: string = 'general',
    notes?: string,
    customStartDate?: Date
  ) => {
    if (!user || isGuest) {
      toast.error('Please log in to start tracking');
      return null;
    }

    try {
      // Verify session before database operation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expired. Please refresh and try again.');
        return null;
      }

      // Use custom start date if provided, otherwise use today (local timezone)
      const startDate = customStartDate 
        ? getLocalDateString(customStartDate)
        : getLocalDateString(new Date());

      const { data, error } = await supabase
        .from('sobriety_tracking')
        .insert({
          user_id: session.user.id,
          target_days: targetDays,
          substance_type: substanceType,
          notes: notes || null,
          start_date: startDate,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          toast.error('Session issue. Please try logging out and back in.');
        } else {
          toast.error('Failed to start journey');
        }
        throw error;
      }

      const journey: SobrietyJourney = {
        id: data.id,
        startDate: new Date(data.start_date),
        targetDays: data.target_days,
        isActive: data.is_active,
        substanceType: data.substance_type || 'general',
        notes: data.notes,
        endDate: null,
        reasonEnded: null,
        createdAt: new Date(data.created_at),
      };

      setActiveJourney(journey);
      toast.success('Your sobriety journey has begun! 🌱');
      return journey;
    } catch (error: any) {
      console.error('Error starting journey:', error);
      return null;
    }
  };

  const dailyCheckin = async (feeling?: string) => {
    if (!user || isGuest) {
      toast.error('Please sign in to check in');
      return null;
    }

    if (!activeJourney) {
      toast.error('Start a sobriety journey first');
      return null;
    }

    const currentDay = getCurrentDay();

    // Check if already checked in today (local timezone)
    const today = getLocalDateString(new Date());
    const alreadyCheckedIn = checkins.some(
      c => getLocalDateString(c.checkinDate) === today
    );

    if (alreadyCheckedIn) {
      toast.info('You\'ve already checked in today!');
      return null;
    }

    try {
      // Verify session before database operation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error('Session expired. Please refresh and try again.');
        return null;
      }

      const { data: coins, error } = await supabase.rpc('award_sobriety_coins', {
        _user_id: session.user.id,
        _sobriety_id: activeJourney.id,
        _day_number: currentDay,
        _feeling: feeling || null,
      });

      if (error) throw error;

      const isMilestone = MILESTONES.includes(currentDay);

      toast.success(
        isMilestone
          ? `🎉 Day ${currentDay} milestone! +${coins} Tap Coins!`
          : `Day ${currentDay} complete! +${coins} Tap Coins 🌱`
      );

      // Award XP for sobriety check-in
      try {
        const { data: xpResult } = await supabase.rpc('award_xp', {
          p_user_id: session.user.id,
          p_xp_amount: 25,
          p_source: 'sobriety'
        });
        if (xpResult) {
          window.dispatchEvent(new CustomEvent('xpAwarded', {
            detail: { amount: 25, source: 'sobriety', result: xpResult }
          }));
        }
      } catch (xpError) {
        console.error('Error awarding XP for sobriety:', xpError);
      }

      // Trigger achievement check
      window.dispatchEvent(new CustomEvent('achievement:check'));

      // Refresh data
      await fetchActiveJourney();

      return coins;
    } catch (error: any) {
      console.error('Error checking in:', error);
      const message = error?.message || 'Failed to check in';
      toast.error(message);
      return null;
    }
  };

  const resetJourney = async (reason: string = 'reset') => {
    if (!user || isGuest || !activeJourney) {
      return false;
    }

    try {
      // Verify session before database operation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expired. Please refresh and try again.');
        return false;
      }

      const { error } = await supabase
        .from('sobriety_tracking')
        .update({
          is_active: false,
          end_date: getLocalDateString(new Date()),
          reason_ended: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeJourney.id);

      if (error) throw error;

      setActiveJourney(null);
      setCheckins([]);
      toast.info('Journey ended. Remember, every day is a new opportunity! 💪');
      await fetchActiveJourney();
      return true;
    } catch (error: any) {
      console.error('Error resetting journey:', error);
      toast.error('Failed to reset journey');
      return false;
    }
  };

  const completeJourney = async () => {
    if (!user || isGuest || !activeJourney) {
      return false;
    }

    try {
      // Verify session before database operation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expired. Please refresh and try again.');
        return false;
      }

      const { error } = await supabase
        .from('sobriety_tracking')
        .update({
          is_active: false,
          end_date: getLocalDateString(new Date()),
          reason_ended: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeJourney.id);

      if (error) throw error;

      toast.success('🎉 Congratulations! You completed your sobriety goal!');
      await fetchActiveJourney();
      return true;
    } catch (error: any) {
      console.error('Error completing journey:', error);
      toast.error('Failed to complete journey');
      return false;
    }
  };

  const getCurrentDay = (): number => {
    if (!activeJourney) return 0;
    const start = activeJourney.startDate;
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Day 1 is the start day
  };

  const getProgress = (): SobrietyProgress | null => {
    if (!activeJourney) return null;

    const currentDay = getCurrentDay();
    const today = getLocalDateString(new Date());
    const checkedInToday = checkins.some(
      c => getLocalDateString(c.checkinDate) === today
    );
    const totalCoinsEarned = checkins.reduce((sum, c) => sum + c.coinsAwarded, 0);
    
    // Find next milestone
    const nextMilestone = MILESTONES.find(m => m > currentDay) || null;
    const daysToNextMilestone = nextMilestone ? nextMilestone - currentDay : null;

    return {
      currentDay,
      targetDays: activeJourney.targetDays,
      percentComplete: Math.min(100, Math.round((currentDay / activeJourney.targetDays) * 100)),
      daysRemaining: Math.max(0, activeJourney.targetDays - currentDay),
      totalCoinsEarned,
      nextMilestone,
      daysToNextMilestone,
      checkedInToday,
    };
  };

  const updateStartDate = async (newStartDate: Date) => {
    if (!user || isGuest || !activeJourney) {
      return false;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expired. Please refresh and try again.');
        return false;
      }

      const { error } = await supabase
        .from('sobriety_tracking')
        .update({
          start_date: getLocalDateString(newStartDate),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeJourney.id);

      if (error) throw error;

      toast.success('Start date updated! 🗓️');
      await fetchActiveJourney();
      return true;
    } catch (error: any) {
      console.error('Error updating start date:', error);
      toast.error('Failed to update start date');
      return false;
    }
  };

  // Add missed sober days - user taps specific days they were sober
  const addMissedSoberDays = async (dates: Date[]) => {
    if (!user || isGuest || !activeJourney || dates.length === 0) {
      return false;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expired. Please refresh and try again.');
        return false;
      }

      // Convert dates to local date strings and sort them
      const localDates = dates.map(d => getLocalDateString(d)).sort();
      const earliestDate = localDates[0];

      // Update start date to the earliest selected date
      const { error: updateError } = await supabase
        .from('sobriety_tracking')
        .update({
          start_date: earliestDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeJourney.id);

      if (updateError) throw updateError;

      toast.success(`Added ${dates.length} sober day${dates.length > 1 ? 's' : ''}! 🌱`);
      await fetchActiveJourney();
      return true;
    } catch (error: any) {
      console.error('Error adding missed sober days:', error);
      toast.error('Failed to add sober days');
      return false;
    }
  };

  // Get dates that have been checked in (for calendar display)
  const getCheckedInDates = (): string[] => {
    return checkins.map(c => getLocalDateString(c.checkinDate));
  };

  return {
    activeJourney,
    checkins,
    pastJourneys,
    isLoading,
    startJourney,
    dailyCheckin,
    resetJourney,
    completeJourney,
    updateStartDate,
    addMissedSoberDays,
    getCheckedInDates,
    getCurrentDay,
    getProgress,
    refetch: fetchActiveJourney,
  };
};
