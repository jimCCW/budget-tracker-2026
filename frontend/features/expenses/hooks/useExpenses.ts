'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Expense } from '@/types/expense';

async function fetchExpenses(filters?: {
  year?: number;
  month?: number;
}): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (filters?.year !== undefined) params.set('year', String(filters.year));
  if (filters?.month !== undefined) params.set('month', String(filters.month));
  const qs = params.toString();
  const body = await apiClient.get<
    never,
    { success: boolean; data: Expense[] }
  >(`/api/expenses${qs ? `?${qs}` : ''}`);
  return body.data;
}

export function useExpenses(filters?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => fetchExpenses(filters),
  });
}
