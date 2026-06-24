import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResendActivation } from '@/features/auth/hooks/useResendActivation';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

describe('useResendActivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/auth/resend with email', async () => {
    mockPost.mockResolvedValue({ email: 'user@example.com' });

    const { result } = renderHook(() => useResendActivation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'user@example.com' });
    });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/resend', {
      email: 'user@example.com',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Already activated'));

    const { result } = renderHook(() => useResendActivation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ email: 'user@example.com' });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
