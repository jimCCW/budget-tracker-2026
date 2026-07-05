import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardRecentActivity } from '@/features/dashboard/hooks/useDashboardRecentActivity';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubActivity = {
  items: [],
  nextCursor: null,
  hasNextPage: false,
  total: 0,
  totalPages: 1,
};

describe('useDashboardRecentActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/activity with type=ALL and pageSize=5', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubActivity });

    const { result } = renderHook(() => useDashboardRecentActivity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/activity', {
      params: { type: 'ALL', pageSize: 5 },
    });
    expect(result.current.data).toEqual(stubActivity);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardRecentActivity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
