import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivity } from '@/features/activity/hooks/useActivity';
import { createWrapper } from '../../../helpers/createWrapper';
import type {
  ActivityFilters,
  ActivityListResponse,
} from '@/features/activity/types/activity';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const baseFilters: ActivityFilters = { type: 'ALL' };

const stubResponse: ActivityListResponse = {
  items: [],
  nextCursor: null,
  hasNextPage: false,
  total: 0,
  totalPages: 1,
};

describe('useActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /api/activity with just the type param when no other filters are set', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubResponse });

    const { result } = renderHook(() => useActivity(baseFilters, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/activity', {
      params: { type: 'ALL' },
    });
    expect(result.current.data).toEqual(stubResponse);
  });

  it('includes categoryId, startDate, endDate, and search when provided', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubResponse });

    const filters: ActivityFilters = {
      type: 'EXPENSE',
      categoryId: 'cat-1',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      search: 'lunch',
    };

    const { result } = renderHook(() => useActivity(filters, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/activity', {
      params: {
        type: 'EXPENSE',
        categoryId: 'cat-1',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.999Z',
        search: 'lunch',
      },
    });
  });

  it('includes the cursor param when a cursor is provided', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubResponse });

    const { result } = renderHook(
      () => useActivity(baseFilters, 'opaque-cursor'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/activity', {
      params: { type: 'ALL', cursor: 'opaque-cursor' },
    });
  });

  it('omits the cursor param when cursor is null', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubResponse });

    const { result } = renderHook(() => useActivity(baseFilters, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const params = mockGet.mock.calls[0][1]?.params as Record<string, unknown>;
    expect('cursor' in params).toBe(false);
  });

  it('returns the unwrapped data payload', async () => {
    const populated: ActivityListResponse = {
      ...stubResponse,
      total: 2,
      items: [
        {
          id: 'exp-1',
          type: 'EXPENSE',
          date: '2026-06-01T00:00:00.000Z',
          amount: 50,
          note: 'Lunch',
          isRecurring: false,
          createdAt: '2026-06-01T00:00:00.000Z',
          category: { id: 'cat-1', name: 'Food', icon: null, color: null },
          account: { id: 'acc-1', name: 'Main bank' },
        },
      ],
    };
    mockGet.mockResolvedValue({ success: true, data: populated });

    const { result } = renderHook(() => useActivity(baseFilters, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(populated);
  });
});
