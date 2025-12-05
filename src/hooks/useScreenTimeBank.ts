import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScreenTimeBank {
  id: string;
  user_id: string;
  earned_minutes: number;
  used_minutes: number;
  push_ups_per_minute: number;
  last_earning_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenTimeSession {
  id: string;
  user_id: string;
  platform: string;
  started_at: string;
  ended_at: string | null;
  minutes_used: number;
  created_at: string;
}

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'snapchat' | 'twitter' | 'other';

export const PLATFORM_CONFIG: Record<Platform, { name: string; icon: string; color: string; url: string }> = {
  instagram: { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-500', url: 'https://instagram.com' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'from-black to-pink-500', url: 'https://tiktok.com' },
  youtube: { name: 'YouTube', icon: '▶️', color: 'from-red-500 to-red-600', url: 'https://youtube.com' },
  snapchat: { name: 'Snapchat', icon: '👻', color: 'from-yellow-400 to-yellow-500', url: 'https://snapchat.com' },
  twitter: { name: 'X / Twitter', icon: '𝕏', color: 'from-gray-800 to-gray-900', url: 'https://x.com' },
  other: { name: 'Other', icon: '📱', color: 'from-gray-500 to-gray-600', url: '' },
};

export const useScreenTimeBank = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch or create screen time bank
  const { data: bank, isLoading: bankLoading } = useQuery({
    queryKey: ['screen-time-bank'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      // Try to fetch existing bank
      const { data, error } = await supabase
        .from('screen_time_bank')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No bank exists, create one
        const { data: newBank, error: createError } = await supabase
          .from('screen_time_bank')
          .insert({ user_id: session.user.id })
          .select()
          .single();

        if (createError) throw createError;
        return newBank as ScreenTimeBank;
      }

      if (error) throw error;
      return data as ScreenTimeBank;
    },
  });

  // Fetch usage sessions (last 7 days)
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['screen-time-sessions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('screen_time_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('started_at', sevenDaysAgo.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as ScreenTimeSession[];
    },
  });

  // Calculate available minutes
  const availableMinutes = bank ? bank.earned_minutes - bank.used_minutes : 0;

  // Add earned time from push-ups
  const addEarnedTime = useMutation({
    mutationFn: async ({ pushUps }: { pushUps: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      const pushUpsPerMinute = bank?.push_ups_per_minute || 5;
      const earnedMinutes = Math.floor(pushUps / pushUpsPerMinute);

      if (earnedMinutes <= 0) return { earnedMinutes: 0 };

      const { error } = await supabase
        .from('screen_time_bank')
        .update({
          earned_minutes: (bank?.earned_minutes || 0) + earnedMinutes,
          last_earning_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (error) throw error;
      return { earnedMinutes };
    },
    onSuccess: ({ earnedMinutes }) => {
      queryClient.invalidateQueries({ queryKey: ['screen-time-bank'] });
      if (earnedMinutes > 0) {
        toast({
          title: '🎉 Screen Time Earned!',
          description: `You earned ${earnedMinutes} minute${earnedMinutes !== 1 ? 's' : ''} of social media time!`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: '❌ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Start a usage session
  const startSession = useMutation({
    mutationFn: async ({ platform }: { platform: Platform }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      if (availableMinutes <= 0) {
        throw new Error('No screen time available. Do some push-ups to earn more!');
      }

      const { data, error } = await supabase
        .from('screen_time_sessions')
        .insert({
          user_id: session.user.id,
          platform,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScreenTimeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-time-sessions'] });
    },
    onError: (error) => {
      toast({
        title: '❌ Cannot start session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // End a usage session
  const endSession = useMutation({
    mutationFn: async ({ sessionId, minutesUsed }: { sessionId: string; minutesUsed: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      // End the session
      const { error: sessionError } = await supabase
        .from('screen_time_sessions')
        .update({
          ended_at: new Date().toISOString(),
          minutes_used: minutesUsed,
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Update used minutes in bank
      const { error: bankError } = await supabase
        .from('screen_time_bank')
        .update({
          used_minutes: (bank?.used_minutes || 0) + minutesUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (bankError) throw bankError;

      return { minutesUsed };
    },
    onSuccess: ({ minutesUsed }) => {
      queryClient.invalidateQueries({ queryKey: ['screen-time-bank'] });
      queryClient.invalidateQueries({ queryKey: ['screen-time-sessions'] });
      toast({
        title: '⏱️ Session ended',
        description: `You used ${minutesUsed} minute${minutesUsed !== 1 ? 's' : ''} of screen time.`,
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Error ending session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update exchange rate (push-ups per minute)
  const updateExchangeRate = useMutation({
    mutationFn: async ({ pushUpsPerMinute }: { pushUpsPerMinute: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('screen_time_bank')
        .update({
          push_ups_per_minute: pushUpsPerMinute,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-time-bank'] });
      toast({ title: '✅ Exchange rate updated!' });
    },
  });

  // Get usage by platform
  const usageByPlatform = sessions?.reduce((acc, session) => {
    const platform = session.platform as Platform;
    acc[platform] = (acc[platform] || 0) + session.minutes_used;
    return acc;
  }, {} as Record<Platform, number>) || {};

  // Get total usage today
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = sessions?.filter(s => 
    s.started_at.startsWith(today)
  ).reduce((acc, s) => acc + s.minutes_used, 0) || 0;

  return {
    bank,
    availableMinutes,
    sessions,
    usageByPlatform,
    todayUsage,
    isLoading: bankLoading || sessionsLoading,
    addEarnedTime: addEarnedTime.mutateAsync,
    startSession: startSession.mutateAsync,
    endSession: endSession.mutateAsync,
    updateExchangeRate: updateExchangeRate.mutateAsync,
  };
};
