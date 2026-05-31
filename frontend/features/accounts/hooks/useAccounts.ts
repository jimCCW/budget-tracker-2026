'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Account } from '@/types/account';

async function fetchAccounts(): Promise<Account[]> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: Account[] }
  >('/api/accounts');
  return body.data;
}

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
}
