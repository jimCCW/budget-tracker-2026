import type { Prisma } from '@prisma/client';
import { appError } from '../utils/appError';
import { prisma } from '../lib/prisma';
import { describeUserAgent } from '../utils/userAgent';

/**
 * Lists the authenticated user's active (non-revoked) sessions, newest first,
 * flagging which one the current request's own JWT belongs to.
 * @param userId - The authenticated user's ID.
 * @param currentSessionId - The `sid` claim from the caller's own JWT.
 * @returns The user's active sessions with a device label and `current` flag.
 */
export async function listSessions(userId: string, currentSessionId: string) {
  const sessions = await prisma.userSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map((session) => ({
    id: session.id,
    device: describeUserAgent(session.userAgent),
    createdAt: session.createdAt,
    current: session.id === currentSessionId,
  }));
}

/**
 * Revokes one of the authenticated user's *other* sessions, immediately
 * invalidating that device's JWT on its next request.
 * @param userId - The authenticated user's ID; must own the session.
 * @param sessionId - The session to revoke.
 * @param currentSessionId - The `sid` claim from the caller's own JWT.
 * @throws NOT_FOUND (404) if no active session exists with that ID for this user.
 * @throws CONFLICT (409) if the caller tries to revoke their own current session (use sign out instead).
 * @returns `{ revoked: true }` on success.
 */
export async function revokeSession(
  userId: string,
  sessionId: string,
  currentSessionId: string
) {
  if (sessionId === currentSessionId) {
    throw appError(
      'CONFLICT',
      'You cannot revoke your current session — sign out instead.',
      409
    );
  }

  const result = await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0)
    throw appError('NOT_FOUND', 'Session not found.', 404);

  return { revoked: true };
}

/**
 * Revokes every active session for a user, used after a password change or reset so old JWTs stop working immediately.
 * @param userId - The user whose sessions should all be revoked.
 * @param client - Prisma client or `$transaction` tx to run the write on; defaults to the shared singleton.
 * @returns The number of sessions revoked.
 */
export async function revokeAllSessions(
  userId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  const result = await client.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}
