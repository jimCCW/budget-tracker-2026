'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { UserProfile } from '@/types/user';

async function fetchProfile(): Promise<UserProfile> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: UserProfile }
  >('/api/users/me');
  return body.data;
}

export function useProfile() {
  return useQuery({ queryKey: ['user'], queryFn: fetchProfile });
}
