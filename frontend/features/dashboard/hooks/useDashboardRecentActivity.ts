'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ActivityListResponse } from '@/features/activity/types/activity';

async function fetchRecentActivity(): Promise<ActivityListResponse> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: ActivityListResponse }
  >('/api/activity', { params: { type: 'ALL', pageSize: 5 } });
  return body.data;
}

export function useDashboardRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: fetchRecentActivity,
  });
}
