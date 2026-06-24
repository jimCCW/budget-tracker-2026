import { RecurrenceType, RecurringKind } from '@prisma/client';
import { appError } from '../utils/appError';
import {
  verifyAccountOwnership,
  verifyCategoryOwnership,
} from '../utils/authorizationUtils';
import { firstRunDate } from '../utils/recurrence';
import { materializeDueTransactions } from './recurrenceEngine';
import { prisma } from '../lib/prisma';

/**
 * Returns all recurring rules for the given user, ordered by creation date.
 * @param userId - The authenticated user's ID.
 * @returns Array of RecurringRule records with account and category info.
 */
export async function getAll(userId: string) {
  return prisma.recurringRule.findMany({
    where: { userId },
    include: { account: true, category: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Returns a single recurring rule owned by the given user.
 * @param userId - The authenticated user's ID.
 * @param id - The rule ID.
 * @throws NOT_FOUND (404) if the rule does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function getById(userId: string, id: string) {
  const rule = await prisma.recurringRule.findUnique({
    where: { id },
    include: { account: true, category: true },
  });
  if (!rule) throw appError('NOT_FOUND', 'Recurring rule not found.', 404);
  if (rule.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to view this rule.',
      403
    );
  return rule;
}

/**
 * Creates a recurring rule and immediately materialises any due occurrences.
 * Sets anchorDay from startDate for MONTHLY rules. Validates account and category ownership.
 * @param userId - The authenticated user's ID.
 * @param data - Rule fields.
 * @returns The newly created RecurringRule with account and category info.
 * @throws NOT_FOUND (404) if the account or category does not exist.
 * @throws FORBIDDEN (403) if the account belongs to another user.
 */
export async function create(
  userId: string,
  data: {
    kind: RecurringKind;
    amount: number;
    accountId: string;
    categoryId?: string;
    note?: string;
    frequency: RecurrenceType;
    interval?: number;
    startDate: string;
    endDate?: string;
  }
) {
  await verifyAccountOwnership(prisma, userId, data.accountId);

  if (data.categoryId) {
    await verifyCategoryOwnership(prisma, userId, data.categoryId);
  }

  const parsedStart = new Date(data.startDate);
  // anchorDay captures the intended day-of-month for MONTHLY rules
  const anchorDay =
    data.frequency === 'MONTHLY' ? parsedStart.getUTCDate() : null;
  const nextRunDate = firstRunDate(parsedStart, data.frequency);

  const rule = await prisma.recurringRule.create({
    data: {
      userId,
      kind: data.kind,
      amount: data.amount,
      accountId: data.accountId,
      categoryId: data.categoryId,
      note: data.note,
      frequency: data.frequency,
      interval: data.interval ?? 1,
      startDate: parsedStart,
      endDate: data.endDate ? new Date(data.endDate) : null,
      anchorDay,
      nextRunDate,
    },
    include: { account: true, category: true },
  });

  // Materialise immediately if startDate is in the past or today
  if (parsedStart <= new Date()) {
    await materializeDueTransactions(userId);
  }

  return rule;
}

/**
 * Updates a recurring rule's non-structural fields.
 * @param userId - The authenticated user's ID.
 * @param id - The rule ID to update.
 * @param data - Fields to update (all optional).
 * @throws NOT_FOUND (404) if the rule does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function update(
  userId: string,
  id: string,
  data: {
    amount?: number;
    accountId?: string;
    categoryId?: string;
    note?: string;
    frequency?: RecurrenceType;
    interval?: number;
    endDate?: string;
  }
) {
  const rule = await prisma.recurringRule.findUnique({ where: { id } });
  if (!rule) throw appError('NOT_FOUND', 'Recurring rule not found.', 404);
  if (rule.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to edit this rule.',
      403
    );

  if (data.accountId && data.accountId !== rule.accountId) {
    await verifyAccountOwnership(prisma, userId, data.accountId);
  }

  if (data.categoryId && data.categoryId !== rule.categoryId) {
    await verifyCategoryOwnership(prisma, userId, data.categoryId);
  }

  return prisma.recurringRule.update({
    where: { id },
    data: {
      amount: data.amount,
      accountId: data.accountId,
      categoryId: data.categoryId,
      note: data.note,
      frequency: data.frequency,
      interval: data.interval,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: { account: true, category: true },
  });
}

/**
 * Pauses or resumes a recurring rule.
 * @param userId - The authenticated user's ID.
 * @param id - The rule ID.
 * @param isActive - True to resume, false to pause.
 * @throws NOT_FOUND (404) if the rule does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function setActive(userId: string, id: string, isActive: boolean) {
  const rule = await prisma.recurringRule.findUnique({ where: { id } });
  if (!rule) throw appError('NOT_FOUND', 'Recurring rule not found.', 404);
  if (rule.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to modify this rule.',
      403
    );

  return prisma.recurringRule.update({
    where: { id },
    data: { isActive },
    include: { account: true, category: true },
  });
}

/**
 * Deletes a recurring rule. Historical Income/Expense rows are preserved
 * (their recurringRuleId is set to null via onDelete: SetNull).
 * @param userId - The authenticated user's ID.
 * @param id - The rule ID to delete.
 * @returns `{ deleted: true }` on success.
 * @throws NOT_FOUND (404) if the rule does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function remove(userId: string, id: string) {
  const rule = await prisma.recurringRule.findUnique({ where: { id } });
  if (!rule) throw appError('NOT_FOUND', 'Recurring rule not found.', 404);
  if (rule.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to delete this rule.',
      403
    );

  await prisma.recurringRule.delete({ where: { id } });
  return { deleted: true };
}
