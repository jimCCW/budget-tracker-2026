import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRevokeSession } from '@/features/settings/hooks/useRevokeSession';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

describe('useRevokeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts /api/sessions/:id/revoke', async () => {
    mockPost.mockResolvedValue({ success: true, data: { revoked: true } });

    const { result } = renderHook(() => useRevokeSession(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('session-2');
    });

    expect(mockPost).toHaveBeenCalledWith('/api/sessions/session-2/revoke');
  });

  it('is in error state when revoking the current session (409)', async () => {
    mockPost.mockRejectedValue(
      new Error('You cannot revoke your current session — sign out instead.')
    );

    const { result } = renderHook(() => useRevokeSession(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('session-1');
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
