import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('next-auth/react', () => ({ getSession }));

type AuthTokenModule = typeof import('@/lib/authToken');

let authToken: AuthTokenModule;

beforeEach(async () => {
  vi.resetModules();
  getSession.mockReset();
  getSession.mockResolvedValue({ accessToken: 'fallback-token' });
  authToken = await import('@/lib/authToken');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getAccessToken', () => {
  it('returns null before the session has settled', () => {
    expect(authToken.getAccessToken()).toBeNull();
  });

  it('returns the published token', () => {
    authToken.publishAccessToken('tok');
    expect(authToken.getAccessToken()).toBe('tok');
  });

  it('is falsy once the token is cleared', () => {
    authToken.publishAccessToken('tok');
    authToken.publishAccessToken(null);
    expect(authToken.getAccessToken()).toBeNull();
  });
});

describe('resolveAccessToken', () => {
  it('resolves without a network call once the token is published', async () => {
    authToken.publishAccessToken('tok');

    await expect(authToken.resolveAccessToken()).resolves.toBe('tok');
    expect(getSession).not.toHaveBeenCalled();
  });

  it('releases callers waiting on the pending session', async () => {
    const pending = authToken.resolveAccessToken();
    authToken.publishAccessToken('tok');

    await expect(pending).resolves.toBe('tok');
    expect(getSession).not.toHaveBeenCalled();
  });

  it('resolves null when the session settles unauthenticated', async () => {
    const pending = authToken.resolveAccessToken();
    authToken.publishAccessToken(null);

    await expect(pending).resolves.toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });

  it('falls back to getSession only after the readiness timeout', async () => {
    vi.useFakeTimers();
    const pending = authToken.resolveAccessToken();

    await vi.advanceTimersByTimeAsync(2999);
    expect(getSession).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toBe('fallback-token');
    expect(getSession).toHaveBeenCalledWith({ broadcast: false });
  });

  it('publishes the fallback result so later calls need no fetch', async () => {
    vi.useFakeTimers();
    const pending = authToken.resolveAccessToken();
    await vi.advanceTimersByTimeAsync(3000);
    await pending;

    expect(authToken.getAccessToken()).toBe('fallback-token');
    await expect(authToken.resolveAccessToken()).resolves.toBe(
      'fallback-token'
    );
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent fallback fetches', async () => {
    let settle: (session: { accessToken: string }) => void = () => {};
    getSession.mockReturnValue(
      new Promise<{ accessToken: string }>((resolve) => {
        settle = resolve;
      })
    );

    vi.useFakeTimers();
    const first = authToken.resolveAccessToken();
    const second = authToken.resolveAccessToken();
    await vi.advanceTimersByTimeAsync(3000);

    settle({ accessToken: 'tok' });

    await expect(first).resolves.toBe('tok');
    await expect(second).resolves.toBe('tok');
    expect(getSession).toHaveBeenCalledTimes(1);
  });
});
