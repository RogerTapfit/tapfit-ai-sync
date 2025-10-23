import { useQuery } from '@tanstack/react-query';
import { swimStorageService } from '@/services/swimStorageService';
import { useAuth } from '@/hooks/useAuth';

export function useSwimHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['swim-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await swimStorageService.getUserSessions(user.id);
    },
    enabled: !!user?.id,
  });
}
