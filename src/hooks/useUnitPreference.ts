import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UnitSystem = 'imperial' | 'metric';

export interface UnitPreference {
  unitSystem: UnitSystem;
  loading: boolean;
  updateUnitPreference: (system: UnitSystem) => Promise<void>;
}

export const useUnitPreference = (userId?: string): UnitPreference => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchUnitPreference();
  }, [userId]);

  const fetchUnitPreference = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('unit_preference')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUnitSystem((data?.unit_preference as UnitSystem) || 'imperial');
    } catch (error) {
      console.error('Error fetching unit preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUnitPreference = async (system: UnitSystem) => {
    if (!userId) {
      toast.error('Please sign in to update preferences');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ unit_preference: system })
        .eq('id', userId);

      if (error) throw error;

      setUnitSystem(system);
      toast.success(`Units changed to ${system === 'imperial' ? 'Imperial (lbs, ft, in)' : 'Metric (kg, cm)'}`);
    } catch (error) {
      console.error('Error updating unit preference:', error);
      toast.error('Failed to update unit preference');
    }
  };

  return {
    unitSystem,
    loading,
    updateUnitPreference
  };
};
