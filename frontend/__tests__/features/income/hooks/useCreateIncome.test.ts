import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateIncome } from '@/features/income/hooks/useCreateIncome';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const stubIncome = {
  id: 'inc-1',
  amount: 3000,
  date: '2026-06-01',
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

const validInput = {
  accountId: 'acc-1',
  categoryId: 'cat-1',
  amount: 3000,
  date: '2026-06-01',
};

describe('useCreateIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/income and returns the created income', async () => {
    mockPost.mockResolvedValue({ success: true, data: stubIncome });

    const { result } = renderHook(() => useCreateIncome(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/income', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubIncome));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateIncome(), {
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
