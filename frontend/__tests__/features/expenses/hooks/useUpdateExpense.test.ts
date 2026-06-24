import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateExpense } from '@/features/expenses/hooks/useUpdateExpense';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubExpense = {
  id: 'exp-1',
  amount: 75,
  date: '2026-06-01',
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

describe('useUpdateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/expenses/:id with updated values', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubExpense });

    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'exp-1', values: { amount: 75 } });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/expenses/exp-1', {
      amount: 75,
    });
    await waitFor(() => expect(result.current.data).toEqual(stubExpense));
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: 'exp-1',
          values: { amount: 75 },
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
