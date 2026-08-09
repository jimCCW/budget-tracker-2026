import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteAccount } from '@/features/settings/hooks/useDeleteAccount';
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

  it('sends the password as the DELETE request body', async () => {
    mockDelete.mockResolvedValue({ success: true, data: { deleted: true } });

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ password: 'MyPassw0rd!' });
    });

    expect(mockDelete).toHaveBeenCalledWith('/api/users/me', {
      data: { password: 'MyPassw0rd!' },
    });
  });

  it('is in error state when the password is wrong', async () => {
    mockDelete.mockRejectedValue(new Error('Password is incorrect.'));

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ password: 'wrong' });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
