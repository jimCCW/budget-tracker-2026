import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubAccount = {
  id: 'acc-2',
  name: 'Emergency Fund',
  type: 'BANK',
  balance: 8000,
  icon: 'pi-building',
  color: '#00FF00',
};

const validInput = {
  name: 'Emergency Fund',
  type: 'BANK' as const,
  balance: 8000,
  icon: 'pi-building',
  color: '#00FF00',
};

describe('useUpdateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/accounts/:id with updated values', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubAccount });

    const { result } = renderHook(() => useUpdateAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'acc-2', values: validInput });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/accounts/acc-2', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubAccount));
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateAccount(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'acc-2', values: validInput });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
