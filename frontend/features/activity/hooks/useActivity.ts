'use client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ActivityFilters, ActivityListResponse } from '../types/activity';

async function fetchActivity(
  filters: ActivityFilters,
  cursor: string | null
): Promise<ActivityListResponse> {
  const params: Record<string, string> = { type: filters.type };
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.search) params.search = filters.search;
  if (cursor) params.cursor = cursor;

  const body = await apiClient.get<
    never,
    { success: boolean; data: ActivityListResponse }
  >('/api/activity', { params });
  return body.data;
}

export function useActivity(filters: ActivityFilters, cursor: string | null) {
  return useQuery({
    queryKey: ['activity', filters, cursor],
    queryFn: () => fetchActivity(filters, cursor),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
