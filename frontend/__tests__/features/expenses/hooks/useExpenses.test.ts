import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubExpenses = [
  {
    id: 'exp-1',
    amount: 50,
    date: '2026-06-01',
    categoryId: 'cat-1',
    accountId: 'acc-1',
  },
];

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/expenses without filters', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubExpenses });

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/expenses');
    expect(result.current.data).toEqual(stubExpenses);
  });

  it('appends year query param when year is provided', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useExpenses({ year: 2026 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/expenses?year=2026');
  });

  it('appends year and month query params when both are provided', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useExpenses({ year: 2026, month: 6 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/expenses?year=2026&month=6');
  });
});
