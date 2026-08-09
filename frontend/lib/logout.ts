import { signOut } from 'next-auth/react';
import { apiClient } from '@/lib/api';

/**
 * Revokes the current session server-side (best-effort — sign-out proceeds
 * even if this fails) before clearing the NextAuth session, so a signed-out
 * device doesn't linger as "active" in Settings > Security on other devices.
 * Shared by AppShell's sidebar sign-out button and the Settings page.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout').catch(() => {});
  await signOut({ callbackUrl: '/login' });
}
