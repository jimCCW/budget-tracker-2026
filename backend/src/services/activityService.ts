import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { appError } from '../utils/appError';

export type ActivityType = 'EXPENSE' | 'INCOME';

export type ActivityFilters = {
  type?: 'ALL' | ActivityType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  date: string;
  amount: number;
  note: string | null;
  isRecurring: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  account: { id: string; name: string };
};

export type ActivityListResult = {
  items: ActivityItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
  total: number;
  totalPages: number;
};

type Cursor = { date: string; createdAt: string; id: string };

/**
 * Decodes an opaque activity cursor (base64 JSON) into its parts.
 * Throws a VALIDATION_ERROR if the cursor is malformed.
 */
function decodeCursor(cursor?: string): Cursor | undefined {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    if (!parsed.date || !parsed.createdAt || !parsed.id) throw new Error();
    return parsed;
  } catch {
    throw appError('VALIDATION_ERROR', 'Invalid activity cursor.', 400);
  }
}

/**
 * Encodes the sort key of the last row on a page into an opaque cursor for the next page.
 */
function encodeCursor(item: ActivityItem): string {
  const cursor: Cursor = {
    date: item.date,
    createdAt: item.createdAt,
    id: item.id,
  };
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/** Builds a Prisma date-range filter from startDate/endDate, or undefined if neither is set. */
function buildDateRange(
  filters: ActivityFilters
): { gte?: Date; lte?: Date } | undefined {
  if (!filters.startDate && !filters.endDate) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (filters.startDate) range.gte = new Date(filters.startDate);
  if (filters.endDate) range.lte = new Date(filters.endDate);
  return range;
}

/**
 * Keyset (cursor) condition for the merged (date desc, createdAt desc, id desc) sort order.
 * Kept generic so it applies identically to the Expense and Income where clauses.
 */
function keysetCondition(cursor?: Cursor) {
  if (!cursor) return undefined;
  const cursorDate = new Date(cursor.date);
  const cursorCreatedAt = new Date(cursor.createdAt);
  return {
    OR: [
      { date: { lt: cursorDate } },
      { date: cursorDate, createdAt: { lt: cursorCreatedAt } },
      { date: cursorDate, createdAt: cursorCreatedAt, id: { lt: cursor.id } },
    ],
  };
}

/** Builds the Expense `where` clause for the given user, filters, and optional keyset cursor. */
function buildExpenseWhere(
  userId: string,
  filters: ActivityFilters,
  cursor?: Cursor
): Prisma.ExpenseWhereInput {
  const base: Prisma.ExpenseWhereInput = {
    userId,
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(buildDateRange(filters) && { date: buildDateRange(filters) }),
    ...(filters.search && {
      description: { contains: filters.search, mode: 'insensitive' },
    }),
  };
  const keyset = keysetCondition(cursor);
  return keyset ? { AND: [base, keyset] } : base;
}

/** Builds the Income `where` clause for the given user, filters, and optional keyset cursor. */
function buildIncomeWhere(
  userId: string,
  filters: ActivityFilters,
  cursor?: Cursor
): Prisma.IncomeWhereInput {
  const base: Prisma.IncomeWhereInput = {
    userId,
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(buildDateRange(filters) && { date: buildDateRange(filters) }),
    ...(filters.search && {
      note: { contains: filters.search, mode: 'insensitive' },
    }),
  };
  const keyset = keysetCondition(cursor);
  return keyset ? { AND: [base, keyset] } : base;
}

const ORDER_BY = [
  { date: 'desc' as const },
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
];

type ExpenseRow = Prisma.ExpenseGetPayload<{
  include: { category: true; account: true };
}>;
type IncomeRow = Prisma.IncomeGetPayload<{
  include: { category: true; account: true };
}>;

/** Maps a raw Expense or Income row (with category/account included) into the shared ActivityItem shape. */
function toActivityRow(
  type: ActivityType,
  row: ExpenseRow | IncomeRow
): ActivityItem {
  return {
    id: row.id,
    type,
    date: row.date.toISOString(),
    amount: row.amount,
    note:
      (type === 'EXPENSE'
        ? (row as ExpenseRow).description
        : (row as IncomeRow).note) ?? null,
    isRecurring: row.recurringRuleId != null,
    createdAt: row.createdAt.toISOString(),
    category: {
      id: row.category.id,
      name: row.category.name,
      icon: row.category.icon,
      color: row.category.color,
    },
    account: { id: row.account.id, name: row.account.name },
  };
}

/** Comparator for the merged feed's sort order: date desc, then createdAt desc, then id desc. */
function compareDesc(a: ActivityItem, b: ActivityItem): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? 1 : -1;
}

/**
 * Returns one page of the merged Expense+Income activity feed for the user, newest first.
 * Uses keyset (cursor) pagination merged across both tables, so cost stays ~O(pageSize)
 * per request regardless of how deep the user paginates.
 * @param userId - The authenticated user's ID.
 * @param filters - Type/category/date-range/search filters applied to both tables.
 * @param cursorStr - Opaque cursor from a previous page's `nextCursor`, or undefined for page 1.
 * @param pageSize - Rows per page.
 * @returns One page of items plus `nextCursor`/`hasNextPage` and the overall `total`/`totalPages`.
 * @throws VALIDATION_ERROR (400) if `cursorStr` is malformed or has been tampered with.
 */
export async function getActivity(
  userId: string,
  filters: ActivityFilters,
  cursorStr?: string,
  pageSize = 10
): Promise<ActivityListResult> {
  const cursor = decodeCursor(cursorStr);
  const take = pageSize + 1;
  const includeExpense = filters.type !== 'INCOME';
  const includeIncome = filters.type !== 'EXPENSE';

  const [expenseRows, incomeRows, expenseCount, incomeCount] =
    await Promise.all([
      includeExpense
        ? prisma.expense.findMany({
            where: buildExpenseWhere(userId, filters, cursor),
            include: { category: true, account: true },
            orderBy: ORDER_BY,
            take,
          })
        : Promise.resolve([] as ExpenseRow[]),
      includeIncome
        ? prisma.income.findMany({
            where: buildIncomeWhere(userId, filters, cursor),
            include: { category: true, account: true },
            orderBy: ORDER_BY,
            take,
          })
        : Promise.resolve([] as IncomeRow[]),
      includeExpense
        ? prisma.expense.count({ where: buildExpenseWhere(userId, filters) })
        : Promise.resolve(0),
      includeIncome
        ? prisma.income.count({ where: buildIncomeWhere(userId, filters) })
        : Promise.resolve(0),
    ]);

  const candidates = [
    ...expenseRows.map((row) => toActivityRow('EXPENSE', row)),
    ...incomeRows.map((row) => toActivityRow('INCOME', row)),
  ].sort(compareDesc);

  const items = candidates.slice(0, pageSize);
  const hasNextPage = candidates.length > pageSize;
  const nextCursor = hasNextPage ? encodeCursor(items[items.length - 1]) : null;
  const total = expenseCount + incomeCount;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, nextCursor, hasNextPage, total, totalPages };
}

/**
 * Returns the full merged+sorted Expense+Income feed matching the filters, unpaginated —
 * used for Excel export so the file always reflects every filtered row, not just one page.
 * @param userId - The authenticated user's ID.
 * @param filters - Type/category/date-range/search filters applied to both tables.
 * @returns Every matching row across both tables, merged and sorted, with no pagination applied.
 */
export async function getActivityForExport(
  userId: string,
  filters: ActivityFilters
): Promise<ActivityItem[]> {
  const includeExpense = filters.type !== 'INCOME';
  const includeIncome = filters.type !== 'EXPENSE';

  const [expenseRows, incomeRows] = await Promise.all([
    includeExpense
      ? prisma.expense.findMany({
          where: buildExpenseWhere(userId, filters),
          include: { category: true, account: true },
          orderBy: ORDER_BY,
        })
      : Promise.resolve([] as ExpenseRow[]),
    includeIncome
      ? prisma.income.findMany({
          where: buildIncomeWhere(userId, filters),
          include: { category: true, account: true },
          orderBy: ORDER_BY,
        })
      : Promise.resolve([] as IncomeRow[]),
  ]);

  return [
    ...expenseRows.map((row) => toActivityRow('EXPENSE', row)),
    ...incomeRows.map((row) => toActivityRow('INCOME', row)),
  ].sort(compareDesc);
}
