import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { prisma } from '../lib/prisma';
import * as accountService from './accountService';

dayjs.extend(utc);

const TOP_CATEGORY_COUNT = 5;
const ALL_RANGE_MAX_MONTHS = 36;

export type DashboardSummary = {
  balance: number;
  accountsCount: number;
  income: { total: number; count: number; trendPct: number | null };
  expense: { total: number; count: number; trendPct: number | null };
  saved: { amount: number; pctOfIncome: number | null };
  categoryBreakdown: {
    name: string;
    icon: string;
    color: string;
    value: number;
  }[];
};

export type DashboardTrendRange = '6M' | '1Y' | 'All';
export type DashboardTrendPoint = {
  month: string;
  income: number;
  expenses: number;
};

/** Percentage change of `current` vs `previous`, or null when `previous` is zero/negative (no usable baseline). */
function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Returns dashboard stat-tile figures and the current month's expense-by-category breakdown.
 * @param userId - The authenticated user's ID; "current"/"previous" month are always the server's current date, never caller-supplied.
 * @returns Balance, account count, income/expense/saved figures with trend %, and the top-5 expense category breakdown.
 */
export async function getSummary(userId: string): Promise<DashboardSummary> {
  const now = dayjs.utc();
  const month = now.month() + 1;
  const year = now.year();
  const prevMonthDate = now.subtract(1, 'month');
  const prevMonth = prevMonthDate.month() + 1;
  const prevYear = prevMonthDate.year();

  const monthStart = now.startOf('month').toDate();
  const nextMonthStart = now.add(1, 'month').startOf('month').toDate();
  const prevMonthStart = prevMonthDate.startOf('month').toDate();

  const [
    accountSummary,
    currentIncome,
    prevIncome,
    currentExpenses,
    prevExpenses,
  ] = await Promise.all([
    accountService.getSummary(userId),
    prisma.income.findMany({
      where: { userId, month, year },
      select: { amount: true },
    }),
    prisma.income.findMany({
      where: { userId, month: prevMonth, year: prevYear },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lt: nextMonthStart } },
      select: {
        amount: true,
        categoryId: true,
        category: { select: { name: true, icon: true, color: true } },
      },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: prevMonthStart, lt: monthStart } },
      select: { amount: true },
    }),
  ]);

  const incomeTotal = currentIncome.reduce((sum, r) => sum + r.amount, 0);
  const prevIncomeTotal = prevIncome.reduce((sum, r) => sum + r.amount, 0);
  const expenseTotal = currentExpenses.reduce((sum, r) => sum + r.amount, 0);
  const prevExpenseTotal = prevExpenses.reduce((sum, r) => sum + r.amount, 0);

  const categoryMap = new Map<
    string,
    { name: string; icon: string; color: string; value: number }
  >();
  for (const row of currentExpenses) {
    const existing = categoryMap.get(row.categoryId);
    if (existing) {
      existing.value += row.amount;
    } else {
      categoryMap.set(row.categoryId, {
        name: row.category.name,
        icon: row.category.icon ?? 'pi-tag',
        color: row.category.color ?? '#6b7280',
        value: row.amount,
      });
    }
  }
  const categoryBreakdown = Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_CATEGORY_COUNT);

  const savedAmount = incomeTotal - expenseTotal;

  return {
    balance: accountSummary.netWorth,
    accountsCount: accountSummary.accounts.length,
    income: {
      total: incomeTotal,
      count: currentIncome.length,
      trendPct: trendPct(incomeTotal, prevIncomeTotal),
    },
    expense: {
      total: expenseTotal,
      count: currentExpenses.length,
      trendPct: trendPct(expenseTotal, prevExpenseTotal),
    },
    saved: {
      amount: savedAmount,
      pctOfIncome: incomeTotal > 0 ? (savedAmount / incomeTotal) * 100 : null,
    },
    categoryBreakdown,
  };
}

/** Returns the earliest month with any Income/Expense activity for the user, capped at `ALL_RANGE_MAX_MONTHS` back; falls back to the current month if the user has no transactions. */
async function getAllRangeStart(userId: string) {
  const now = dayjs.utc();
  const [earliestIncome, earliestExpense] = await Promise.all([
    prisma.income.findFirst({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
    prisma.expense.findFirst({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
  ]);

  const candidates = [earliestIncome?.date, earliestExpense?.date].filter(
    (d): d is Date => d != null
  );
  if (candidates.length === 0) return now.startOf('month');

  const earliest = dayjs
    .utc(Math.min(...candidates.map((d) => d.getTime())))
    .startOf('month');
  const cappedStart = now
    .startOf('month')
    .subtract(ALL_RANGE_MAX_MONTHS - 1, 'month');
  return earliest.isBefore(cappedStart) ? cappedStart : earliest;
}

/**
 * Returns a monthly income/expense time series for the cashflow chart, with zero-activity months included as 0 rather than omitted.
 * @param userId - The authenticated user's ID.
 * @param range - '6M' (last 6 months), '1Y' (last 12), or 'All' (since the user's earliest transaction, capped at 36 months).
 * @returns Chronological `{month, income, expenses}` points, `month` labeled `'MMM YY'` so multi-year ranges never collide.
 */
export async function getTrend(
  userId: string,
  range: DashboardTrendRange
): Promise<DashboardTrendPoint[]> {
  const now = dayjs.utc();
  const thisMonthStart = now.startOf('month');

  let windowStart: dayjs.Dayjs;
  if (range === '6M') {
    windowStart = thisMonthStart.subtract(5, 'month');
  } else if (range === '1Y') {
    windowStart = thisMonthStart.subtract(11, 'month');
  } else {
    windowStart = await getAllRangeStart(userId);
  }

  const [incomeRows, expenseRows] = await Promise.all([
    prisma.income.findMany({
      where: { userId, date: { gte: windowStart.toDate() } },
      select: { amount: true, date: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: windowStart.toDate() } },
      select: { amount: true, date: true },
    }),
  ]);

  const buckets = new Map<string, { income: number; expenses: number }>();
  for (
    let cursor = windowStart;
    !cursor.isAfter(thisMonthStart, 'month');
    cursor = cursor.add(1, 'month')
  ) {
    buckets.set(cursor.format('YYYY-MM'), { income: 0, expenses: 0 });
  }

  for (const row of incomeRows) {
    const key = dayjs.utc(row.date).format('YYYY-MM');
    const bucket = buckets.get(key);
    if (bucket) bucket.income += row.amount;
  }
  for (const row of expenseRows) {
    const key = dayjs.utc(row.date).format('YYYY-MM');
    const bucket = buckets.get(key);
    if (bucket) bucket.expenses += row.amount;
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    month: dayjs.utc(key, 'YYYY-MM').format('MMM YY'),
    income: value.income,
    expenses: value.expenses,
  }));
}
