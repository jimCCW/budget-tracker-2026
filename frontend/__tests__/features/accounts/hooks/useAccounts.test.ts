import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubAccounts = [
  {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    balance: 1000,
    icon: 'pi-wallet',
    color: '#0000FF',
  },
];

describe('useAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/accounts and returns accounts', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubAccounts });

    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/accounts');
    expect(result.current.data).toEqual(stubAccounts);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
