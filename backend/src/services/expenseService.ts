import { PrismaClient } from '@prisma/client';
import { appError } from '../utils/appError';

const prisma = new PrismaClient();

/**
 * Returns all expense records for the given user, optionally filtered by date range.
 * @param userId - The authenticated user's ID.
 * @param filters - Optional year and month to filter by.
 * @returns Array of Expense records with account and category info, newest first.
 */
export async function getAll(
  userId: string,
  filters?: { year?: number; month?: number }
) {
  let dateFilter: { gte?: Date; lte?: Date } | undefined;
  if (filters?.year !== undefined && filters?.month !== undefined) {
    const start = new Date(Date.UTC(filters.year, filters.month - 1, 1));
    const end = new Date(
      Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999)
    );
    dateFilter = { gte: start, lte: end };
  } else if (filters?.year !== undefined) {
    const start = new Date(Date.UTC(filters.year, 0, 1));
    const end = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999));
    dateFilter = { gte: start, lte: end };
  }

  return prisma.expense.findMany({
    where: {
      userId,
      ...(dateFilter && { date: dateFilter }),
    },
    include: { account: true, category: true },
    orderBy: { date: 'desc' },
  });
}

/**
 * Returns a single expense record owned by the given user.
 * @param userId - The authenticated user's ID.
 * @param id - The expense ID.
 * @returns The Expense record with account and category info.
 * @throws NOT_FOUND (404) if the record does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function getById(userId: string, id: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { account: true, category: true },
  });
  if (!expense) throw appError('NOT_FOUND', 'Expense record not found.', 404);
  if (expense.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to view this expense.',
      403
    );
  return expense;
}

/**
 * Creates an expense record and atomically decrements the linked account's balance.
 * @param userId - The authenticated user's ID.
 * @param data - Expense fields: accountId, categoryId, amount, date, optional description.
 * @returns The newly created Expense record with account and category info.
 * @throws NOT_FOUND (404) if the account or category does not exist.
 * @throws FORBIDDEN (403) if the account belongs to another user.
 */
export async function create(
  userId: string,
  data: {
    accountId: string;
    categoryId: string;
    amount: number;
    date: string;
    description?: string;
  }
) {
  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
  });
  if (!account) throw appError('NOT_FOUND', 'Account not found.', 404);
  if (account.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to use this account.',
      403
    );

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw appError('NOT_FOUND', 'Category not found.', 404);

  const parsedDate = new Date(data.date);

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        amount: data.amount,
        date: parsedDate,
        description: data.description,
      },
      include: { account: true, category: true },
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: { decrement: data.amount } },
    });

    return expense;
  });
}

/**
 * Updates an expense record and reconciles the account balance delta atomically.
 * Handles account changes by reversing the old delta on the old account and applying the new delta.
 * @param userId - The authenticated user's ID.
 * @param id - The expense ID to update.
 * @param data - Fields to update (all optional).
 * @returns The updated Expense record with account and category info.
 * @throws NOT_FOUND (404) if the expense, new account, or new category does not exist.
 * @throws FORBIDDEN (403) if the expense or new account belongs to another user.
 */
export async function update(
  userId: string,
  id: string,
  data: {
    accountId?: string;
    categoryId?: string;
    amount?: number;
    date?: string;
    description?: string;
  }
) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw appError('NOT_FOUND', 'Expense record not found.', 404);
  if (existing.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to edit this expense.',
      403
    );

  if (data.accountId && data.accountId !== existing.accountId) {
    const newAccount = await prisma.account.findUnique({
      where: { id: data.accountId },
    });
    if (!newAccount) throw appError('NOT_FOUND', 'Account not found.', 404);
    if (newAccount.userId !== userId)
      throw appError(
        'FORBIDDEN',
        'You do not have permission to use this account.',
        403
      );
  }

  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw appError('NOT_FOUND', 'Category not found.', 404);
  }

  const newAmount = data.amount ?? existing.amount;
  const newAccountId = data.accountId ?? existing.accountId;
  const accountChanged = newAccountId !== existing.accountId;
  const amountChanged =
    data.amount !== undefined && data.amount !== existing.amount;

  let parsedDate: Date | undefined;
  if (data.date) {
    parsedDate = new Date(data.date);
  }

  return prisma.$transaction(async (tx) => {
    if (accountChanged) {
      // Reverse old delta on old account, apply new delta on new account
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
      await tx.account.update({
        where: { id: newAccountId },
        data: { balance: { decrement: newAmount } },
      });
    } else if (amountChanged) {
      // Same account — adjust the difference
      const diff = newAmount - existing.amount;
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: diff } },
      });
    }

    return tx.expense.update({
      where: { id },
      data: {
        accountId: newAccountId,
        categoryId: data.categoryId,
        amount: newAmount,
        date: parsedDate,
        description: data.description,
      },
      include: { account: true, category: true },
    });
  });
}

/**
 * Deletes an expense record and reverses its balance deduction from the linked account.
 * @param userId - The authenticated user's ID.
 * @param id - The expense ID to delete.
 * @returns `{ deleted: true }` on success.
 * @throws NOT_FOUND (404) if the record does not exist.
 * @throws FORBIDDEN (403) if it belongs to another user.
 */
export async function remove(userId: string, id: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw appError('NOT_FOUND', 'Expense record not found.', 404);
  if (expense.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to delete this expense.',
      403
    );

  return prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: expense.accountId },
      data: { balance: { increment: expense.amount } },
    });
    await tx.expense.delete({ where: { id } });
    return { deleted: true };
  });
}
