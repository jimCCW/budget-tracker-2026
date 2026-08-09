import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChangePassword } from '@/features/settings/hooks/useChangePassword';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const values = {
  currentPassword: 'OldPassw0rd!',
  password: 'NewPassw0rd!23',
  confirmPassword: 'NewPassw0rd!23',
};

describe('useChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts /api/users/change-password with the form values', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { message: 'Password updated successfully.' },
    });

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(values);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/users/change-password', values);
  });

  it('is in error state when the current password is wrong', async () => {
    mockPost.mockRejectedValue(new Error('Current password is incorrect.'));

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(values);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
