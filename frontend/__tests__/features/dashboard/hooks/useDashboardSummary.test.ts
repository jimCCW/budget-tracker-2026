import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubSummary = {
  balance: 5000,
  accountsCount: 2,
  income: { total: 3000, count: 2, trendPct: 5 },
  expense: { total: 1200, count: 8, trendPct: -3 },
  saved: { amount: 1800, pctOfIncome: 60 },
  categoryBreakdown: [
    { name: 'Food', icon: 'pi-cart', color: '#FF0000', value: 400 },
  ],
};

describe('useDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/dashboard/summary and returns the summary', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubSummary });

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/dashboard/summary');
    expect(result.current.data).toEqual(stubSummary);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
