import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RideSession } from '@/types/ride';

export function useRideHistory() {
  return useQuery({
    queryKey: ['ride-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ride_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as RideSession[];
    },
  });
}
