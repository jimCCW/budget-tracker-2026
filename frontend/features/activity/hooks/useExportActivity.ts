'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ActivityFilters } from '../types/activity';

async function parseBlobError(err: unknown): Promise<never> {
  const response = (err as { response?: { data?: unknown } })?.response;
  if (response?.data instanceof Blob) {
    let message = 'Export failed.';
    try {
      const text = await response.data.text();
      message = JSON.parse(text)?.error?.message ?? message;
    } catch {
      // response body wasn't valid JSON — fall back to the generic message
    }
    throw new Error(message);
  }
  throw err;
}

async function exportActivity(filters: ActivityFilters): Promise<void> {
  const params: Record<string, string> = { type: filters.type };
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.search) params.search = filters.search;

  let blob: Blob;
  try {
    blob = await apiClient.get<never, Blob>('/api/activity/export', {
      params,
      responseType: 'blob',
    });
  } catch (err) {
    return parseBlobError(err);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `activity-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function useExportActivity() {
  return useMutation({ mutationFn: exportActivity });
}
