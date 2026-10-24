import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateRule } from '@/features/recurring/hooks/useCreateRule';
import type { RecurringFormValues } from '@/features/recurring/schemas/recurringSchema';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const stubRule = {
  id: 'rule-1',
  name: 'Monthly Salary',
  amount: 5000,
  frequency: 'MONTHLY',
  isActive: true,
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

const validInput = {
  kind: 'INCOME',
  amount: 5000,
  frequency: 'MONTHLY',
  categoryId: 'cat-1',
  accountId: 'acc-1',
  startDate: '2026-01-01',
  note: 'Monthly Salary',
} satisfies RecurringFormValues;

describe('useCreateRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/recurring and returns the created rule', async () => {
    mockPost.mockResolvedValue({ success: true, data: stubRule });

    const { result } = renderHook(() => useCreateRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/recurring', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubRule));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(validInput);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
