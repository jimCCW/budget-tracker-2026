import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateIncome } from '@/features/income/hooks/useUpdateIncome';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubIncome = {
  id: 'inc-1',
  amount: 5000,
  date: '2026-06-01',
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

describe('useUpdateIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/income/:id with updated values', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubIncome });

    const { result } = renderHook(() => useUpdateIncome(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'inc-1',
        values: { amount: 5000 },
      });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/income/inc-1', {
      amount: 5000,
    });
    await waitFor(() => expect(result.current.data).toEqual(stubIncome));
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateIncome(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: 'inc-1',
          values: { amount: 5000 },
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
