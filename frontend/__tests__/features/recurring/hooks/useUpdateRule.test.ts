import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateRule } from '@/features/recurring/hooks/useUpdateRule';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubRule = {
  id: 'rule-1',
  name: 'Updated Salary',
  amount: 6000,
  frequency: 'MONTHLY',
  isActive: true,
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

describe('useUpdateRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/recurring/:id with updated values', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubRule });

    const { result } = renderHook(() => useUpdateRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'rule-1',
        values: { amount: 6000 },
      });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/recurring/rule-1', {
      amount: 6000,
    });
    await waitFor(() => expect(result.current.data).toEqual(stubRule));
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: 'rule-1',
          values: { amount: 6000 },
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
