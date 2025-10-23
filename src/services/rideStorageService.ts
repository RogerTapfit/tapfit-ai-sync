import { RideSession } from '@/types/ride';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'tapfit_current_ride';

export const rideStorageService = {
  async saveSession(session: RideSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('ride_sessions')
        .upsert({
          id: session.id,
          user_id: session.user_id,
          started_at: session.started_at,
          ended_at: session.ended_at,
          status: session.status,
          total_distance_m: session.total_distance_m,
          moving_time_s: session.moving_time_s,
          elapsed_time_s: session.elapsed_time_s,
          avg_speed_kmh: session.avg_speed_kmh,
          max_speed_kmh: session.max_speed_kmh,
          calories: session.calories,
          unit: session.unit,
          notes: session.notes,
          elevation_gain_m: session.elevation_gain_m,
          elevation_loss_m: session.elevation_loss_m,
          source: session.source,
          points: session.points as any,
          splits: session.splits as any,
          auto_pause_enabled: session.auto_pause_enabled,
          audio_cues_enabled: session.audio_cues_enabled,
          training_mode: session.training_mode,
          target_hr_zone: session.target_hr_zone as any,
          avg_heart_rate: session.avg_heart_rate,
          max_heart_rate: session.max_heart_rate,
          time_in_zone_s: session.time_in_zone_s,
          hr_samples: session.hr_samples as any,
          avg_cadence: session.avg_cadence,
          ride_type: session.ride_type,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save ride to Supabase:', error);
      throw error;
    }
  },

  async getSessionById(sessionId: string): Promise<RideSession | null> {
    try {
      const { data, error } = await supabase
        .from('ride_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        points: (data.points as any) || [],
        splits: (data.splits as any) || [],
        status: data.status as any,
        auto_pause_enabled: data.auto_pause_enabled ?? true,
        audio_cues_enabled: data.audio_cues_enabled ?? true,
      } as unknown as RideSession;
    } catch (error) {
      console.error('Failed to fetch ride session:', error);
      return null;
    }
  },

  async getUserSessions(userId: string): Promise<RideSession[]> {
    try {
      const { data, error } = await supabase
        .from('ride_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];
      
      return data.map(session => ({
        ...session,
        points: (session.points as any) || [],
        splits: (session.splits as any) || [],
        status: session.status as any,
        auto_pause_enabled: session.auto_pause_enabled ?? true,
        audio_cues_enabled: session.audio_cues_enabled ?? true,
      })) as unknown as RideSession[];
    } catch (error) {
      console.error('Failed to fetch user ride sessions:', error);
      return [];
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ride_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete ride session:', error);
      throw error;
    }
  },

  saveCurrentRide(session: RideSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save ride to local storage:', error);
    }
  },

  getCurrentRide(): RideSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load ride from local storage:', error);
      return null;
    }
  },

  clearCurrentRide(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear ride local storage:', error);
    }
  },
};
