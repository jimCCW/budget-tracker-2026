import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateAccount } from '@/features/accounts/hooks/useCreateAccount';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const stubAccount = {
  id: 'acc-2',
  name: 'Savings',
  type: 'BANK',
  balance: 5000,
  icon: 'pi-building',
  color: '#00FF00',
};

const validInput = {
  name: 'Savings',
  type: 'BANK' as const,
  balance: 5000,
  icon: 'pi-building',
  color: '#00FF00',
};

describe('useCreateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/accounts and returns the created account', async () => {
    mockPost.mockResolvedValue({ success: true, data: stubAccount });

    const { result } = renderHook(() => useCreateAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/accounts', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubAccount));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateAccount(), {
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
