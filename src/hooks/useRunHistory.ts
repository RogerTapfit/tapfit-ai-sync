import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RunSession } from '@/types/run';

export function useRunHistory() {
  return useQuery({
    queryKey: ['run-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('run_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Transform database records to RunSession type
      return (data || []).map(record => ({
        id: record.id,
        user_id: record.user_id,
        started_at: record.started_at,
        ended_at: record.ended_at || undefined,
        status: record.status as 'completed',
        total_distance_m: Number(record.total_distance_m),
        moving_time_s: record.moving_time_s,
        elapsed_time_s: record.elapsed_time_s,
        avg_pace_sec_per_km: Number(record.avg_pace_sec_per_km),
        calories: record.calories,
        unit: record.unit as 'km' | 'mi',
        notes: record.notes || undefined,
        elevation_gain_m: record.elevation_gain_m ? Number(record.elevation_gain_m) : 0,
        elevation_loss_m: record.elevation_loss_m ? Number(record.elevation_loss_m) : 0,
        source: 'gps' as const,
        splits: (record.splits as any) || [],
        points: (record.route_points as any) || [],
        auto_pause_enabled: true,
        audio_cues_enabled: true,
      })) as RunSession[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useRunById(runId: string | undefined) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: async () => {
      if (!runId) return null;

      const { data, error } = await supabase
        .from('run_sessions')
        .select('*')
        .eq('id', runId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        started_at: data.started_at,
        ended_at: data.ended_at || undefined,
        status: data.status as RunSession['status'],
        total_distance_m: Number(data.total_distance_m),
        moving_time_s: data.moving_time_s,
        elapsed_time_s: data.elapsed_time_s,
        avg_pace_sec_per_km: Number(data.avg_pace_sec_per_km),
        calories: data.calories,
        unit: data.unit as 'km' | 'mi',
        notes: data.notes || undefined,
        elevation_gain_m: data.elevation_gain_m ? Number(data.elevation_gain_m) : 0,
        elevation_loss_m: data.elevation_loss_m ? Number(data.elevation_loss_m) : 0,
        source: 'gps' as const,
        splits: (data.splits as any) || [],
        points: (data.route_points as any) || [],
        auto_pause_enabled: true,
        audio_cues_enabled: true,
      } as RunSession;
    },
    enabled: !!runId,
  });
}
