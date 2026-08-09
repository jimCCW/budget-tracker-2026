import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

import { apiClient } from '@/lib/api';
import { signOut } from 'next-auth/react';
import { logout } from '@/lib/logout';

const mockPost = vi.mocked(apiClient.post);
const mockSignOut = vi.mocked(signOut);

describe('logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes the current session then signs out', async () => {
    mockPost.mockResolvedValue({});

    await logout();

    expect(mockPost).toHaveBeenCalledWith('/api/auth/logout');
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('still signs out even when the revoke call fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    await logout();

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
