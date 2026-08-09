'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { UserSession } from '@/types/session';

async function fetchSessions(): Promise<UserSession[]> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: UserSession[] }
  >('/api/sessions');
  return body.data;
}

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: fetchSessions });
}
