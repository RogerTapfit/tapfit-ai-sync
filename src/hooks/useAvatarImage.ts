import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Avatar {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
}

export const useAvatarImage = (avatarId?: string) => {
  return useQuery({
    queryKey: ['avatar-image', avatarId],
    queryFn: async () => {
      if (!avatarId) return null;
      
      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, image_url')
        .eq('id', avatarId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching avatar image:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!avatarId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

export const useAvatars = (includeInactive = false) => {
  return useQuery({
    queryKey: ['avatars', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('avatars')
        .select('id, name, image_url, sort_order')
        .order('sort_order', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching avatars:', error);
        return [];
      }
      
      return data as Avatar[];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};
