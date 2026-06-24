import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateCategory } from '@/features/categories/hooks/useCreateCategory';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const stubCategory = {
  id: 'cat-3',
  name: 'Transport',
  icon: 'pi-car',
  color: '#0000FF',
  type: 'EXPENSE',
  isDefault: false,
};

const validInput = {
  name: 'Transport',
  icon: 'pi-car',
  color: '#0000FF',
  type: 'EXPENSE' as const,
};

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/categories and returns the created category', async () => {
    mockPost.mockResolvedValue({ success: true, data: stubCategory });

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/categories', validInput);
    await waitFor(() => expect(result.current.data).toEqual(stubCategory));
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(validInput);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
