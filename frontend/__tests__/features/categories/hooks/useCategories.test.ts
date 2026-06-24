import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubCategories = [
  {
    id: 'cat-1',
    name: 'Food',
    icon: 'pi-shopping-cart',
    color: '#FF0000',
    isDefault: true,
  },
  {
    id: 'cat-2',
    name: 'Custom',
    icon: 'pi-tag',
    color: '#00FF00',
    isDefault: false,
  },
];

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches from /api/categories and returns categories', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubCategories });

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/categories');
    expect(result.current.data).toEqual(stubCategories);
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
