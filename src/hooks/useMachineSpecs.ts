import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MachineSpecs {
  id: string;
  machine_name: string;
  machine_type: string | null;
  min_weight: number | null;
  max_weight: number | null;
  weight_increment: number;
  contributions_count: number;
}

interface UserMachineMax {
  is_at_machine_max: boolean;
  is_at_machine_min: boolean;
  personal_max_weight: number | null;
  typical_reps: number | null;
  typical_weight: number | null;
}

export const useMachineSpecs = (machineName: string) => {
  const [specs, setSpecs] = useState<MachineSpecs | null>(null);
  const [userMax, setUserMax] = useState<UserMachineMax | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecs = async () => {
      if (!machineName) {
        setLoading(false);
        return;
      }

      try {
        // Fetch crowdsourced machine specs
        const { data: specsData, error: specsError } = await supabase
          .from('machine_weight_specs')
          .select('*')
          .eq('machine_name', machineName)
          .maybeSingle();

        if (specsError) {
          console.error('Error fetching machine specs:', specsError);
        } else if (specsData) {
          setSpecs(specsData as MachineSpecs);
        }

        // Fetch user's personal max data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userMaxData, error: userMaxError } = await supabase
            .from('user_machine_maxes')
            .select('*')
            .eq('user_id', user.id)
            .eq('machine_name', machineName)
            .maybeSingle();

          if (userMaxError) {
            console.error('Error fetching user machine max:', userMaxError);
          } else if (userMaxData) {
            setUserMax(userMaxData as UserMachineMax);
          }
        }
      } catch (err) {
        console.error('Error in useMachineSpecs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecs();
  }, [machineName]);

  const contributeSpec = async (
    maxWeight?: number,
    minWeight?: number,
    weightIncrement?: number,
    machineType?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('contribute_machine_spec', {
        _machine_name: machineName,
        _machine_type: machineType || null,
        _min_weight: minWeight || null,
        _max_weight: maxWeight || null,
        _weight_increment: weightIncrement || 5,
        _gym_id: null
      });

      if (error) throw error;
      if (data) {
        setSpecs(data as MachineSpecs);
      }
      return data;
    } catch (err) {
      console.error('Error contributing machine spec:', err);
      throw err;
    }
  };

  const updateUserMax = async (
    isAtMachineMax: boolean,
    isAtMachineMin: boolean,
    personalMaxWeight?: number,
    typicalReps?: number,
    typicalWeight?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('update_user_machine_max', {
        _user_id: user.id,
        _machine_name: machineName,
        _is_at_machine_max: isAtMachineMax,
        _is_at_machine_min: isAtMachineMin,
        _personal_max_weight: personalMaxWeight || null,
        _typical_reps: typicalReps || null,
        _typical_weight: typicalWeight || null
      });

      if (error) throw error;
      if (data) {
        setUserMax(data as UserMachineMax);
      }
      return data;
    } catch (err) {
      console.error('Error updating user machine max:', err);
      throw err;
    }
  };

  return { 
    specs, 
    userMax, 
    loading, 
    contributeSpec, 
    updateUserMax 
  };
};
