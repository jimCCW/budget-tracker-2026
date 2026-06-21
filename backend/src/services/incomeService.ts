import { PrismaClient } from '@prisma/client';
import { appError } from '../utils/appError';
import {
  verifyAccountOwnership,
  verifyCategoryOwnership,
} from '../utils/authorizationUtils';

const prisma = new PrismaClient();

/**
 * Returns all income records for the given user, optionally filtered by year and/or month.
 * @param userId - The authenticated user's ID.
 * @param filters - Optional year and month to filter by.
 * @returns Array of Income records with account and category info, newest first.
 */
export async function getAll(
  userId: string,
  filters?: { year?: number; month?: number }
) {
  return prisma.income.findMany({
    where: {
      userId,
      ...(filters?.year !== undefined && { year: filters.year }),
      ...(filters?.month !== undefined && { month: filters.month }),
    },
    include: { account: true, category: true },
    orderBy: { date: 'desc' },
  });
}

/**
 * Returns a single income record owned by the given user.
 * @param userId - The authenticated user's ID.
 * @param id - The income ID.
 * @returns The Income record with account and category info.
 * @throws NOT_FOUND (404) if the record does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function getById(userId: string, id: string) {
  const income = await prisma.income.findUnique({
    where: { id },
    include: { account: true, category: true },
  });
  if (!income) throw appError('NOT_FOUND', 'Income record not found.', 404);
  if (income.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to view this income.',
      403
    );
  return income;
}

/**
 * Creates an income record and atomically increments the linked account's balance.
 * Derives month/year from the provided date. Validates category ownership.
 * @param userId - The authenticated user's ID.
 * @param data - Income fields: accountId, categoryId, amount, date, optional note.
 * @returns The newly created Income record with account and category info.
 * @throws NOT_FOUND (404) if the account or category does not exist.
 * @throws FORBIDDEN (403) if the account or category belongs to another user.
 */
export async function create(
  userId: string,
  data: {
    accountId: string;
    categoryId: string;
    amount: number;
    date: string;
    note?: string;
  }
) {
  await verifyAccountOwnership(prisma, userId, data.accountId);
  await verifyCategoryOwnership(prisma, userId, data.categoryId);

  const parsedDate = new Date(data.date);
  const month = parsedDate.getUTCMonth() + 1;
  const year = parsedDate.getUTCFullYear();

  return prisma.$transaction(async (tx) => {
    const income = await tx.income.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        amount: data.amount,
        date: parsedDate,
        month,
        year,
        note: data.note,
      },
      include: { account: true, category: true },
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: data.amount } },
    });

    return income;
  });
}

/**
 * Updates an income record and reconciles the account balance delta atomically.
 * Handles account changes by reversing the old delta on the old account and applying the new delta.
 * Validates category ownership if categoryId changes.
 * @param userId - The authenticated user's ID.
 * @param id - The income ID to update.
 * @param data - Fields to update (all optional).
 * @returns The updated Income record with account and category info.
 * @throws NOT_FOUND (404) if the income, new account, or new category does not exist.
 * @throws FORBIDDEN (403) if the income, new account, or new category belongs to another user.
 */
export async function update(
  userId: string,
  id: string,
  data: {
    accountId?: string;
    categoryId?: string;
    amount?: number;
    date?: string;
    note?: string;
  }
) {
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) throw appError('NOT_FOUND', 'Income record not found.', 404);
  if (existing.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to edit this income.',
      403
    );

  if (data.accountId && data.accountId !== existing.accountId) {
    await verifyAccountOwnership(prisma, userId, data.accountId);
  }

  if (data.categoryId && data.categoryId !== existing.categoryId) {
    await verifyCategoryOwnership(prisma, userId, data.categoryId);
  }

  const newAmount = data.amount ?? existing.amount;
  const newAccountId = data.accountId ?? existing.accountId;
  const accountChanged = newAccountId !== existing.accountId;
  const amountChanged =
    data.amount !== undefined && data.amount !== existing.amount;

  let parsedDate: Date | undefined;
  let month: number | undefined;
  let year: number | undefined;
  if (data.date) {
    parsedDate = new Date(data.date);
    month = parsedDate.getUTCMonth() + 1;
    year = parsedDate.getUTCFullYear();
  }

  return prisma.$transaction(async (tx) => {
    if (accountChanged) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } },
      });
      await tx.account.update({
        where: { id: newAccountId },
        data: { balance: { increment: newAmount } },
      });
    } else if (amountChanged) {
      const diff = newAmount - existing.amount;
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: diff } },
      });
    }

    return tx.income.update({
      where: { id },
      data: {
        accountId: newAccountId,
        categoryId: data.categoryId,
        amount: newAmount,
        date: parsedDate,
        month,
        year,
        note: data.note,
      },
      include: { account: true, category: true },
    });
  });
}

/**
 * Deletes an income record and reverses its balance contribution from the linked account.
 * @param userId - The authenticated user's ID.
 * @param id - The income ID to delete.
 * @returns `{ deleted: true }` on success.
 * @throws NOT_FOUND (404) if the record does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function remove(userId: string, id: string) {
  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) throw appError('NOT_FOUND', 'Income record not found.', 404);
  if (income.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to delete this income.',
      403
    );

  return prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: income.accountId },
      data: { balance: { decrement: income.amount } },
    });
    await tx.income.delete({ where: { id } });
    return { deleted: true };
  });
}
