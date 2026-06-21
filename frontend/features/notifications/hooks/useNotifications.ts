'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Notification, NotificationsPage } from '@/types/notification';

type ApiResponse = { success: boolean; data: NotificationsPage };

async function fetchNotifications(cursor?: string): Promise<NotificationsPage> {
  const url = cursor
    ? `/api/notifications?cursor=${encodeURIComponent(cursor)}`
    : '/api/notifications';
  const body = await apiClient.get<never, ApiResponse>(url);
  return body.data;
}

export function useNotifications() {
  return useInfiniteQuery<
    NotificationsPage,
    Error,
    { pages: NotificationsPage[] },
    string[],
    string | undefined
  >({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    staleTime: 30_000,
  });
}

export type { Notification };
