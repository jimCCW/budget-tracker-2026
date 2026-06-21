'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function fetchUnreadCount(): Promise<number> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: { count: number } }
  >('/api/notifications/unread-count');
  return body.data.count;
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
