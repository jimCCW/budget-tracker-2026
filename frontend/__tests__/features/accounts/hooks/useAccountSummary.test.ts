import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccountSummary } from '@/features/accounts/hooks/useAccountSummary';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubSummary = {
  totalBalance: 5000,
  totalInvested: 2000,
  netWorth: 7000,
};

describe('useAccountSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/accounts/summary and returns summary', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubSummary });

    const { result } = renderHook(() => useAccountSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/accounts/summary');
    expect(result.current.data).toEqual(stubSummary);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAccountSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
