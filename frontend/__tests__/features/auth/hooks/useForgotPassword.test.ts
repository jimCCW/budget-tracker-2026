import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/auth/forgot-password with email', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { message: 'Reset email sent' },
    });

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'user@example.com' });
    });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'user@example.com',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ message: 'Reset email sent' });
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('User not found'));

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ email: 'unknown@example.com' });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
