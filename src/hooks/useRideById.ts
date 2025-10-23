import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RideSession } from '@/types/ride';

export function useRideById(rideId: string | undefined) {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: async () => {
      if (!rideId) throw new Error('No ride ID provided');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ride_sessions')
        .select('*')
        .eq('id', rideId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as RideSession;
    },
    enabled: !!rideId,
  });
}
