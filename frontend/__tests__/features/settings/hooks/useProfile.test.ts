import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubProfile = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  currency: 'SGD',
  language: 'English',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /api/users/me', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubProfile });

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(stubProfile));
    expect(mockGet).toHaveBeenCalledWith('/api/users/me');
  });

  it('is in error state when the API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
