import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecurringRules } from '@/features/recurring/hooks/useRecurringRules';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubRules = [
  {
    id: 'rule-1',
    name: 'Monthly Salary',
    amount: 5000,
    frequency: 'MONTHLY',
    isActive: true,
    categoryId: 'cat-1',
    accountId: 'acc-1',
  },
];

describe('useRecurringRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/recurring and returns rules', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubRules });

    const { result } = renderHook(() => useRecurringRules(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/recurring');
    expect(result.current.data).toEqual(stubRules);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRecurringRules(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
