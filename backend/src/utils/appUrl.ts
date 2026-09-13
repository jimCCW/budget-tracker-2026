/**
 * Returns the frontend origin from `FRONTEND_URL`, defaulting to the local Next.js dev server.
 * Read at call time rather than import time so dotenv (loaded only in `index.ts`) has already run.
 * @returns The frontend origin, e.g. `http://localhost:3000`.
 */
export function frontendUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://localhost:3000';
}

/**
 * Builds an absolute URL on the frontend.
 * @param path - Path starting with `/`, e.g. `/reset-password`.
 * @param query - Optional query params; values are URL-encoded and emitted in insertion order.
 * @returns e.g. `http://localhost:3000/reset-password?token=abc&email=a%40b.com`.
 */
export function appUrl(path: string, query?: Record<string, string>): string {
  const qs = query ? new URLSearchParams(query).toString() : '';
  return `${frontendUrl()}${path}${qs ? `?${qs}` : ''}`;
}
