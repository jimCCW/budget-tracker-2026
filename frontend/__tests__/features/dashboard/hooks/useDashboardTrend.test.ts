import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardTrend } from '@/features/dashboard/hooks/useDashboardTrend';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubTrend = [{ month: 'May 26', income: 3000, expenses: 1200 }];

describe('useDashboardTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/dashboard/trend with the given range', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubTrend });

    const { result } = renderHook(() => useDashboardTrend('6M'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/dashboard/trend', {
      params: { range: '6M' },
    });
    expect(result.current.data).toEqual(stubTrend);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardTrend('1Y'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
