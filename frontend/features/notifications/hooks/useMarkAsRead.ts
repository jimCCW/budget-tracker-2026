'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Notification } from '@/types/notification';

async function markAsReadFn(id: string): Promise<Notification> {
  const body = await apiClient.patch<
    never,
    { success: boolean; data: Notification }
  >(`/api/notifications/${id}/read`);
  return body.data;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsReadFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
