import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateCategory } from '@/features/categories/hooks/useUpdateCategory';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPatch = vi.mocked(apiClient.patch);

const stubCategory = {
  id: 'cat-3',
  name: 'Travel',
  icon: 'pi-globe',
  color: '#ABCDEF',
  type: 'EXPENSE',
  isDefault: false,
};

const validInput = {
  name: 'Travel',
  icon: 'pi-globe',
  color: '#ABCDEF',
  type: 'EXPENSE' as const,
};

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches /api/categories/:id with updated values', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubCategory });

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'cat-3', values: validInput });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/categories/cat-3', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubCategory));
  });

  it('is in error state when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'cat-3', values: validInput });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
