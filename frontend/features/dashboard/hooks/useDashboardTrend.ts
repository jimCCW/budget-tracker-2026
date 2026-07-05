'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  DashboardTrendPoint,
  DashboardTrendRange,
} from '../types/dashboard';

async function fetchDashboardTrend(
  range: DashboardTrendRange
): Promise<DashboardTrendPoint[]> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: DashboardTrendPoint[] }
  >('/api/dashboard/trend', { params: { range } });
  return body.data;
}

export function useDashboardTrend(range: DashboardTrendRange) {
  return useQuery({
    queryKey: ['dashboard', 'trend', range],
    queryFn: () => fetchDashboardTrend(range),
  });
}
