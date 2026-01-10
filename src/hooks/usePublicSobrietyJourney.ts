import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicSobrietyJourney {
  id: string;
  user_id: string;
  substance_type: string;
  target_days: number;
  start_date: string;
  current_day: number;
  total_checkins: number;
  progress_percentage: number;
  is_active: boolean;
  milestones: {
    day7: boolean;
    day14: boolean;
    day30: boolean;
    day60: boolean;
    day90: boolean;
  };
}

export const usePublicSobrietyJourney = (userId?: string) => {
  const [journey, setJourney] = useState<PublicSobrietyJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharingEnabled, setSharingEnabled] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchPublicJourney();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchPublicJourney = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // First check if user has sharing enabled
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('share_sobriety_journey')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.share_sobriety_journey) {
        setSharingEnabled(false);
        setJourney(null);
        setLoading(false);
        return;
      }

      setSharingEnabled(true);

      // Fetch active sobriety journey
      const { data: journeyData, error: journeyError } = await supabase
        .from('sobriety_tracking')
        .select('id, user_id, substance_type, target_days, start_date, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (journeyError || !journeyData) {
        setJourney(null);
        setLoading(false);
        return;
      }

      // Fetch check-ins count
      let checkinsCount = 0;
      try {
        const { count } = await (supabase
          .from('sobriety_daily_checkins') as any)
          .select('id', { count: 'exact', head: true })
          .eq('journey_id', journeyData.id);
        checkinsCount = count || 0;
      } catch {
        checkinsCount = 0;
      }

      // Calculate current day
      const startDate = new Date(journeyData.start_date);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const progressPercentage = Math.min((currentDay / journeyData.target_days) * 100, 100);

      setJourney({
        id: journeyData.id,
        user_id: journeyData.user_id,
        substance_type: journeyData.substance_type || 'general',
        target_days: journeyData.target_days,
        start_date: journeyData.start_date,
        current_day: currentDay,
        total_checkins: checkinsCount || 0,
        progress_percentage: progressPercentage,
        is_active: journeyData.is_active,
        milestones: {
          day7: currentDay >= 7,
          day14: currentDay >= 14,
          day30: currentDay >= 30,
          day60: currentDay >= 60,
          day90: currentDay >= 90
        }
      });
    } catch (error) {
      console.error('Error fetching public sobriety journey:', error);
      setJourney(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    journey,
    loading,
    sharingEnabled,
    refetch: fetchPublicJourney
  };
};
