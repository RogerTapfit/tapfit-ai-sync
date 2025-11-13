import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FitnessAlarm {
  id: string;
  user_id: string;
  alarm_time: string;
  enabled: boolean;
  push_up_count: number;
  alarm_sound: string;
  days_of_week: number[];
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlarmCompletion {
  id: string;
  alarm_id: string;
  user_id: string;
  completed_at: string;
  push_ups_completed: number;
  time_to_complete: number;
}

export const useFitnessAlarm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all alarms
  const { data: alarms, isLoading } = useQuery({
    queryKey: ['fitness-alarms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fitness_alarms')
        .select('*')
        .order('alarm_time', { ascending: true });

      if (error) throw error;
      return data as FitnessAlarm[];
    },
  });

  // Create alarm
  const createAlarm = useMutation({
    mutationFn: async (alarm: Omit<FitnessAlarm, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('fitness_alarms')
        .insert({ ...alarm, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-alarms'] });
      toast({ title: '✅ Alarm created successfully!' });
    },
    onError: (error) => {
      toast({ title: '❌ Failed to create alarm', description: error.message, variant: 'destructive' });
    },
  });

  // Update alarm
  const updateAlarm = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FitnessAlarm> }) => {
      const { data, error } = await supabase
        .from('fitness_alarms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-alarms'] });
      toast({ title: '✅ Alarm updated!' });
    },
    onError: (error) => {
      toast({ title: '❌ Failed to update alarm', description: error.message, variant: 'destructive' });
    },
  });

  // Delete alarm
  const deleteAlarm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fitness_alarms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-alarms'] });
      toast({ title: '🗑️ Alarm deleted' });
    },
    onError: (error) => {
      toast({ title: '❌ Failed to delete alarm', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle alarm enabled/disabled
  const toggleAlarm = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('fitness_alarms')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-alarms'] });
    },
  });

  // Log completion
  const logCompletion = useMutation({
    mutationFn: async (completion: Omit<AlarmCompletion, 'id' | 'user_id' | 'completed_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('alarm_completions')
        .insert({ ...completion, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '🎉 Great job! Alarm completed!' });
    },
  });

  return {
    alarms,
    isLoading,
    createAlarm: createAlarm.mutateAsync,
    updateAlarm: updateAlarm.mutateAsync,
    deleteAlarm: deleteAlarm.mutateAsync,
    toggleAlarm: toggleAlarm.mutateAsync,
    logCompletion: logCompletion.mutateAsync,
  };
};
