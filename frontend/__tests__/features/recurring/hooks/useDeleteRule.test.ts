import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteRule } from '@/features/recurring/hooks/useDeleteRule';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { delete: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockDelete = vi.mocked(apiClient.delete);

describe('useDeleteRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes to /api/recurring/:id', async () => {
    mockDelete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('rule-1');
    });

    expect(mockDelete).toHaveBeenCalledWith('/api/recurring/rule-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('is in error state when the API call fails', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDeleteRule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('rule-1');
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
