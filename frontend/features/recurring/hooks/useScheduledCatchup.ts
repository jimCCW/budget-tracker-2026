import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api';

async function runCatchup(): Promise<{ created: number }> {
  const res = await apiClient.post<
    never,
    { success: boolean; data: { created: number } }
  >('/api/recurring/catchup');
  return res.data;
}

export function useScheduledCatchup() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['catchup'],
    queryFn: runCatchup,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data && query.data.created > 0) {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    }
  }, [query.data, queryClient]);

  return query;
}
