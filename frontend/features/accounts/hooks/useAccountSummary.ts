'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AccountSummary } from '@/types/account';

async function fetchAccountSummary(): Promise<AccountSummary> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: AccountSummary }
  >('/api/accounts/summary');
  return body.data;
}

export function useAccountSummary() {
  return useQuery({
    queryKey: ['accounts', 'summary'],
    queryFn: fetchAccountSummary,
  });
}
