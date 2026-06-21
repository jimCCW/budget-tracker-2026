'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function markAllAsReadFn(): Promise<{ count: number }> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: { count: number } }
  >('/api/notifications/read-all');
  return body.data;
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsReadFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
