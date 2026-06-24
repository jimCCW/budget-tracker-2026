import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteAccount } from '@/features/accounts/hooks/useDeleteAccount';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { delete: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockDelete = vi.mocked(apiClient.delete);

describe('useDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes to /api/accounts/:id', async () => {
    mockDelete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('acc-2');
    });

    expect(mockDelete).toHaveBeenCalledWith('/api/accounts/acc-2');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('is in error state when the API call fails', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('acc-2');
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
