import { materializeDueTransactions } from './recurrenceEngine';

const THROTTLE_MS = 60_000;
const lastRun = new Map<string, number>();

/**
 * Runs the recurrence catch-up for a user, throttled to at most once per minute.
 * Never throws — errors are logged so reads are never broken by a recurrence bug.
 * @param userId - The authenticated user's ID.
 */
export async function runCatchupThrottled(userId: string): Promise<void> {
  const now = Date.now();
  const last = lastRun.get(userId) ?? 0;
  if (now - last < THROTTLE_MS) return;

  lastRun.set(userId, now);

  try {
    await materializeDueTransactions(userId);
  } catch (err) {
    console.error(`catchupService: catch-up failed for user ${userId}:`, err);
  }
}
