import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  onboarding_completed: boolean;
  calibration_completed: boolean;
  weight_kg?: number;
  height_cm?: number;
  gender?: string;
  diet_type?: string;
}

export const useOnboarding = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, calibration_completed, weight_kg, height_cm, gender, diet_type')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const needsOnboarding = profile && !profile.onboarding_completed;
  const needsCalibration = profile && profile.onboarding_completed && !profile.calibration_completed;

  return {
    profile,
    loading,
    error,
    needsOnboarding,
    needsCalibration,
    refetch: fetchProfile
  };
};