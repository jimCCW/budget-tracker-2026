import { PrismaClient, RecurringKind } from '@prisma/client';
import { computeNextRunDate } from '../utils/recurrence';

const prisma = new PrismaClient();

const MAX_ITERATIONS_PER_RULE = 366;

/**
 * Materialises all due recurring occurrences for a user.
 * For each active rule where nextRunDate <= now, creates an Income or Expense record
 * and adjusts the linked account balance atomically. Advances nextRunDate after each
 * occurrence. Idempotent: a P2002 unique-constraint violation means the occurrence
 * was already created — it is skipped without double-counting the balance.
 * @param userId - The authenticated user's ID.
 * @param now - The reference time (defaults to current time).
 * @returns The number of new transaction records created.
 */
export async function materializeDueTransactions(
  userId: string,
  now: Date = new Date()
): Promise<{ created: number }> {
  const rules = await prisma.recurringRule.findMany({
    where: { userId, isActive: true, nextRunDate: { lte: now } },
    orderBy: { nextRunDate: 'asc' },
  });

  let created = 0;

  for (const rule of rules) {
    let iterations = 0;
    let nextRun = rule.nextRunDate;

    while (
      nextRun <= now &&
      (!rule.endDate || nextRun <= rule.endDate) &&
      iterations < MAX_ITERATIONS_PER_RULE
    ) {
      iterations++;
      const occurrenceDate = nextRun;
      const nextComputed = computeNextRunDate(
        occurrenceDate,
        rule.frequency,
        rule.interval,
        rule.anchorDay
      );

      // Guard: INCOME rules require a category; skip if missing (legacy rule)
      if (rule.kind === RecurringKind.INCOME && !rule.categoryId) {
        console.warn(
          `recurrenceEngine: INCOME rule ${rule.id} has no categoryId — skipping`
        );
        break;
      }

      try {
        await prisma.$transaction(async (tx) => {
          if (rule.kind === RecurringKind.INCOME) {
            const d = occurrenceDate;
            const month = d.getUTCMonth() + 1;
            const year = d.getUTCFullYear();

            await tx.income.create({
              data: {
                userId,
                accountId: rule.accountId,
                categoryId: rule.categoryId!,
                recurringRuleId: rule.id,
                amount: rule.amount,
                date: occurrenceDate,
                month,
                year,
                note: rule.note,
              },
            });
            await tx.account.update({
              where: { id: rule.accountId },
              data: { balance: { increment: rule.amount } },
            });
          } else {
            await tx.expense.create({
              data: {
                userId,
                accountId: rule.accountId,
                categoryId: rule.categoryId!,
                recurringRuleId: rule.id,
                amount: rule.amount,
                date: occurrenceDate,
                description: rule.note,
              },
            });
            await tx.account.update({
              where: { id: rule.accountId },
              data: { balance: { decrement: rule.amount } },
            });
          }

          await tx.recurringRule.update({
            where: { id: rule.id },
            data: { lastRunDate: occurrenceDate, nextRunDate: nextComputed },
          });
        });

        created++;
      } catch (err: unknown) {
        // P2002 = unique constraint violation — occurrence already exists; skip
        if (isPrismaUniqueError(err)) {
          // Still advance nextRunDate to avoid getting stuck
          await prisma.recurringRule.update({
            where: { id: rule.id },
            data: { lastRunDate: occurrenceDate, nextRunDate: nextComputed },
          });
        } else {
          // Unexpected error — log and abort this rule, don't block others
          console.error(
            `recurrenceEngine: rule ${rule.id} failed at ${occurrenceDate.toISOString()}:`,
            err
          );
          break;
        }
      }

      nextRun = nextComputed;
    }
  }

  return { created };
}

/** Returns true if the error is a Prisma P2002 unique-constraint violation. */
function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}
