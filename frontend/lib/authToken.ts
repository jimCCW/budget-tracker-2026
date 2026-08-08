import { getSession } from 'next-auth/react';

type TokenState =
  | { status: 'pending' }
  | { status: 'ready'; token: string | null };

/**
 * How long a request waits for <SessionTokenSync /> to report the session
 * before falling back to a direct getSession() fetch. Only reachable if the
 * sync component is not mounted inside <SessionProvider>.
 */
const READY_TIMEOUT_MS = 3000;

let state: TokenState = { status: 'pending' };
let markReady: (() => void) | undefined;
const ready = new Promise<void>((resolve) => {
  markReady = resolve;
});
let inFlight: Promise<string | null> | null = null;

const isBrowser = () => typeof window !== 'undefined';

// Reading through a function keeps callers from narrowing `state` and holding
// that narrowing across an await, past the point publishAccessToken reassigns it.
function readState(): TokenState {
  return state;
}

export function publishAccessToken(token: string | null): void {
  if (!isBrowser()) return;
  state = { status: 'ready', token };
  markReady?.();
}

export function getAccessToken(): string | null {
  const current = readState();
  return current.status === 'ready' ? current.token : null;
}

function fetchTokenOnce(): Promise<string | null> {
  inFlight ??= getSession({ broadcast: false })
    .then((session) => {
      const token = session?.accessToken ?? null;
      publishAccessToken(token);
      return token;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export async function resolveAccessToken(): Promise<string | null> {
  if (!isBrowser()) return null;

  const initial = readState();
  if (initial.status === 'ready') return initial.token;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, READY_TIMEOUT_MS);
  });

  try {
    await Promise.race([ready, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }

  const settled = readState();
  if (settled.status === 'ready') return settled.token;
  return fetchTokenOnce();
}
