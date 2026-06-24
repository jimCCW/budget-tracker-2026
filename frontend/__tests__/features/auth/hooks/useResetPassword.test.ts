import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const validInput = {
  email: 'user@example.com',
  token: 'reset-token-abc',
  password: 'NewPass1!',
  confirmPassword: 'NewPass1!',
};

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/auth/reset-password with email, token, and password', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { message: 'Password reset' },
    });

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/reset-password', {
      email: validInput.email,
      token: validInput.token,
      password: validInput.password,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ message: 'Password reset' });
  });

  it('is in error state when the token is invalid', async () => {
    mockPost.mockRejectedValue(new Error('Invalid or expired token'));

    const { result } = renderHook(() => useResetPassword(), {
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
