import { useQuery } from '@tanstack/react-query';
import { swimStorageService } from '@/services/swimStorageService';

export function useSwimById(swimId: string | undefined) {
  return useQuery({
    queryKey: ['swim-session', swimId],
    queryFn: async () => {
      if (!swimId) throw new Error('Swim ID is required');
      return await swimStorageService.getSessionById(swimId);
    },
    enabled: !!swimId,
  });
}
