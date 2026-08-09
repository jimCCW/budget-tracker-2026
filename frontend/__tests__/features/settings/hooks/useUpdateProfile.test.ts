import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { patch: vi.fn() },
}));
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

import { apiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';

const mockPatch = vi.mocked(apiClient.patch);
const mockUseSession = vi.mocked(useSession);

const stubProfile = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane Q. Doe',
  firstName: 'Jane',
  lastName: 'Q. Doe',
  currency: 'SGD',
  language: 'English',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useUpdateProfile', () => {
  const update = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockClear();
    mockUseSession.mockReturnValue({
      data: null,
      status: 'authenticated',
      update,
    } as never);
  });

  it('patches /api/users/me with the new first and last name', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubProfile });

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        firstName: 'Jane',
        lastName: 'Q. Doe',
        name: 'Jane Q. Doe',
      });
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/users/me', {
      firstName: 'Jane',
      lastName: 'Q. Doe',
      name: 'Jane Q. Doe',
    });
    await waitFor(() => expect(result.current.data).toEqual(stubProfile));
  });

  it('refreshes the NextAuth session with the updated name fields on success', async () => {
    mockPatch.mockResolvedValue({ success: true, data: stubProfile });

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        firstName: 'Jane',
        lastName: 'Q. Doe',
        name: 'Jane Q. Doe',
      });
    });

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        name: 'Jane Q. Doe',
        firstName: 'Jane',
        lastName: 'Q. Doe',
      })
    );
  });

  it('does not refresh the session when the API call fails', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
        firstName: 'Jane',
        lastName: 'Q. Doe',
        name: 'Jane Q. Doe',
      });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(update).not.toHaveBeenCalled();
  });
});
