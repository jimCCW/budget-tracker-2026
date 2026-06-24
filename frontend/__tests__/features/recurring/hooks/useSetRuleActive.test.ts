import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSetRuleActive } from '@/features/recurring/hooks/useSetRuleActive';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubRule = {
  id: 'rule-1',
  name: 'Monthly Salary',
  amount: 5000,
  frequency: 'MONTHLY',
  isActive: false,
  categoryId: 'cat-1',
  accountId: 'acc-1',
};

describe('useSetRuleActive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/recurring/:id/active with isActive flag', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubRule });

    const { result } = renderHook(() => useSetRuleActive(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'rule-1', isActive: false });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/recurring/rule-1/active', {
      isActive: false,
    });
    await waitFor(() => expect(result.current.data).toEqual(stubRule));
  });

  it('can activate a rule', async () => {
    mockPatch.mockResolvedValue({
      success: true,
      data: { ...stubRule, isActive: true },
    });

    const { result } = renderHook(() => useSetRuleActive(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'rule-1', isActive: true });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/recurring/rule-1/active', {
      isActive: true,
    });
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSetRuleActive(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'rule-1', isActive: false });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
