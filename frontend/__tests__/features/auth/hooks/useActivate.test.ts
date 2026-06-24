import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActivate } from '@/features/auth/hooks/useActivate';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const validInput = { email: 'user@example.com', code: '123456' };

describe('useActivate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/auth/activate with email and code', async () => {
    mockPost.mockResolvedValue({ message: 'Account activated' });

    const { result } = renderHook(() => useActivate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/activate', validInput);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Invalid code'));

    const { result } = renderHook(() => useActivate(), {
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
