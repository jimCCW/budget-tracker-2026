'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { publishAccessToken } from '@/lib/authToken';

/**
 * Bridges the NextAuth session into the module-level token store consumed by
 * apiClient's request interceptor. Renders nothing; must be mounted inside
 * <SessionProvider>.
 */
export function SessionTokenSync(): null {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken ?? null;

  useEffect(() => {
    if (status === 'loading') return;
    publishAccessToken(status === 'authenticated' ? accessToken : null);
  }, [status, accessToken]);

  return null;
}
