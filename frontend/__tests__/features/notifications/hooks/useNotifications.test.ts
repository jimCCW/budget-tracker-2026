import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubPage = {
  notifications: [
    {
      id: 'notif-1',
      type: 'EXPENSE_DEBITED',
      isRead: false,
      createdAt: '2026-06-21T10:00:00.000Z',
    },
  ],
  nextCursor: null,
};

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches first page from /api/notifications without cursor', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubPage });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/notifications');
    expect(result.current.data?.pages[0]).toEqual(stubPage);
  });

  it('fetches next page with cursor appended to URL', async () => {
    const firstPage = { notifications: [], nextCursor: 'cursor-abc' };
    const secondPage = { notifications: [], nextCursor: null };

    mockGet
      .mockResolvedValueOnce({ success: true, data: firstPage })
      .mockResolvedValueOnce({ success: true, data: secondPage });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);
  });

  it('hasNextPage is false when nextCursor is null', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubPage });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
