'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { RecurringRule } from '@/types/recurring';

async function fetchRecurringRules(): Promise<RecurringRule[]> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: RecurringRule[] }
  >('/api/recurring');
  return body.data;
}

export function useRecurringRules() {
  return useQuery({ queryKey: ['recurring'], queryFn: fetchRecurringRules });
}
