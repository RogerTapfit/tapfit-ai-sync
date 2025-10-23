import { supabase } from '@/integrations/supabase/client';
import { SwimSession } from '@/types/swim';

export const swimStorageService = {
  async saveSession(session: SwimSession): Promise<void> {
    const { error } = await supabase
      .from('swim_sessions')
      .insert({
        id: session.id,
        user_id: session.user_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        status: session.status,
        total_distance_m: session.total_distance_m,
        moving_time_s: Math.round(session.moving_time_s),
        elapsed_time_s: Math.round(session.elapsed_time_s),
        avg_pace_sec_per_100m: session.avg_pace_sec_per_100m,
        calories: session.calories,
        unit: session.unit,
        notes: session.notes,
        source: session.source,
        laps: session.laps as any,
        training_mode: session.training_mode,
        target_hr_zone: session.target_hr_zone as any,
        avg_heart_rate: session.avg_heart_rate,
        max_heart_rate: session.max_heart_rate,
        time_in_zone_s: Math.round(session.time_in_zone_s || 0),
        hr_samples: session.hr_samples as any,
        stroke_type: session.stroke_type,
        pool_length_m: session.pool_length_m,
        total_laps: session.total_laps,
        avg_strokes_per_lap: session.avg_strokes_per_lap,
        swolf_score: session.swolf_score,
      });

    if (error) throw error;
  },

  async getSessionById(sessionId: string): Promise<SwimSession | null> {
    const { data, error } = await supabase
      .from('swim_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data as any as SwimSession;
  },

  async getUserSessions(userId: string): Promise<SwimSession[]> {
    const { data, error } = await supabase
      .from('swim_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return (data as any as SwimSession[]) || [];
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('swim_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },
};
