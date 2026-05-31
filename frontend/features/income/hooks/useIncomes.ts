'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Income } from '@/types/income';

async function fetchIncomes(filters?: {
  year?: number;
  month?: number;
}): Promise<Income[]> {
  const params = new URLSearchParams();
  if (filters?.year !== undefined) params.set('year', String(filters.year));
  if (filters?.month !== undefined) params.set('month', String(filters.month));
  const qs = params.toString();
  const body = await apiClient.get<never, { success: boolean; data: Income[] }>(
    `/api/income${qs ? `?${qs}` : ''}`
  );
  return body.data;
}

export function useIncomes(filters?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: ['income', filters],
    queryFn: () => fetchIncomes(filters),
  });
}
