'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { DashboardSummary } from '../types/dashboard';

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: DashboardSummary }
  >('/api/dashboard/summary');
  return body.data;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  });
}
