import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockPost = vi.mocked(apiClient.post);

const validInput = {
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'Secure1!',
};

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/auth/register and returns email', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { email: validInput.email },
    });

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/register', {
      name: validInput.name,
      firstName: validInput.firstName,
      lastName: validInput.lastName,
      email: validInput.email,
      password: validInput.password,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ email: validInput.email });
  });

  it('is in error state when the API call fails', async () => {
    mockPost.mockRejectedValue(new Error('Email already registered'));

    const { result } = renderHook(() => useRegister(), {
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
