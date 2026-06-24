import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMarkAsRead } from '@/features/notifications/hooks/useMarkAsRead';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubNotification = {
  id: 'notif-1',
  type: 'EXPENSE_DEBITED',
  isRead: true,
  createdAt: '2026-06-21T10:00:00.000Z',
};

describe('useMarkAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/notifications/:id/read', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubNotification });

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('notif-1');
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/notifications/notif-1/read');
    await waitFor(() => expect(result.current.data).toEqual(stubNotification));
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('notif-1');
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
