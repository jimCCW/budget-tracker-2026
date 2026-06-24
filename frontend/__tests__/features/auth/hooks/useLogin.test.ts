import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

import { signIn } from 'next-auth/react';
const mockSignIn = vi.mocked(signIn);

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves successfully when signIn succeeds', async () => {
    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: null,
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'user@example.com',
        password: 'secret',
      });
    });

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'user@example.com',
      password: 'secret',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('throws when signIn returns an error', async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      status: 401,
      url: null,
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'bad@example.com',
          password: 'wrong',
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe(
      'Invalid email or password. Please try again.'
    );
  });

  it('throws when signIn returns null', async () => {
    mockSignIn.mockResolvedValue(null);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'user@example.com',
          password: 'pass',
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
