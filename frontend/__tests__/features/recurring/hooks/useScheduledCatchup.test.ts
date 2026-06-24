import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScheduledCatchup } from '@/features/recurring/hooks/useScheduledCatchup';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

describe('useScheduledCatchup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls /api/recurring/catchup on mount', async () => {
    mockPost.mockResolvedValue({ success: true, data: { created: 0 } });

    const { result } = renderHook(() => useScheduledCatchup(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith('/api/recurring/catchup');
  });

  it('returns created count from the response', async () => {
    mockPost.mockResolvedValue({ success: true, data: { created: 2 } });

    const { result } = renderHook(() => useScheduledCatchup(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ created: 2 });
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useScheduledCatchup(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
