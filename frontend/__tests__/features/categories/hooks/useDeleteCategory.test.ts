import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteCategory } from '@/features/categories/hooks/useDeleteCategory';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { delete: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockDelete = vi.mocked(apiClient.delete);

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes to /api/categories/:id', async () => {
    mockDelete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('cat-3');
    });

    expect(mockDelete).toHaveBeenCalledWith('/api/categories/cat-3');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('is in error state when the API call fails', async () => {
    mockDelete.mockRejectedValue(new Error('Cannot delete default category'));

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('cat-1');
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
