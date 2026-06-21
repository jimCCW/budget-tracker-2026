import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateExpense } from '@/features/expenses/hooks/useCreateExpense';
import { createWrapper } from '../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const stubExpense = {
  id: 'exp-1',
  amount: 50,
  date: '2026-06-01',
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

const validInput = {
  accountId: 'acc-1',
  categoryId: 'cat-1',
  amount: 50,
  date: '2026-06-01',
};

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/expenses and returns the created expense', async () => {
    mockPost.mockResolvedValue({ success: true, data: stubExpense });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/expenses', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubExpense));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateExpense(), {
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
