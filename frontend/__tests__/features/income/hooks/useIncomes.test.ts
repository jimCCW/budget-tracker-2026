import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIncomes } from '@/features/income/hooks/useIncomes';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubIncomes = [
  {
    id: '1',
    amount: 3000,
    date: '2026-06-01',
    categoryId: 'cat-1',
    accountId: 'acc-1',
  },
];

describe('useIncomes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches incomes without filters', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubIncomes });

    const { result } = renderHook(() => useIncomes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/income');
    expect(result.current.data).toEqual(stubIncomes);
  });

  it('appends year and month query params when provided', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useIncomes({ year: 2026, month: 6 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/income?year=2026&month=6');
  });

  it('appends only year when month is omitted', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useIncomes({ year: 2026 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/income?year=2026');
  });

  it('includes filters in the query key', () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useIncomes({ year: 2026, month: 1 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('pending');
  });
});
