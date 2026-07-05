jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    account: { findMany: jest.fn() },
    income: { findMany: jest.fn(), findFirst: jest.fn() },
    expense: { findMany: jest.fn(), findFirst: jest.fn() },
  },
}));

import dayjs from 'dayjs';
import { prisma } from '../../../src/lib/prisma';
import { getSummary, getTrend } from '../../../src/services/dashboardService';

const db = prisma as unknown as {
  account: { findMany: jest.Mock };
  income: { findMany: jest.Mock; findFirst: jest.Mock };
  expense: { findMany: jest.Mock; findFirst: jest.Mock };
};

const USER_ID = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-05-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getSummary', () => {
  it('computes balance/accountsCount from accountService.getSummary', async () => {
    db.account.findMany.mockResolvedValue([
      {
        id: 'acc-1',
        userId: USER_ID,
        type: 'BANK',
        balance: 5000,
      },
    ]);
    db.income.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue([]);

    const result = await getSummary(USER_ID);

    expect(result.balance).toBe(5000);
    expect(result.accountsCount).toBe(1);
  });

  it('computes income/expense totals+counts for the current month only', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany
      .mockResolvedValueOnce([{ amount: 3000 }, { amount: 2000 }]) // current month
      .mockResolvedValueOnce([{ amount: 1000 }]); // previous month
    db.expense.findMany
      .mockResolvedValueOnce([
        {
          amount: 100,
          categoryId: 'cat-1',
          category: { name: 'Food', icon: 'pi-cart', color: '#FF0000' },
        },
      ]) // current month
      .mockResolvedValueOnce([{ amount: 50 }]); // previous month

    const result = await getSummary(USER_ID);

    expect(result.income.total).toBe(5000);
    expect(result.income.count).toBe(2);
    expect(result.expense.total).toBe(100);
    expect(result.expense.count).toBe(1);
    expect(result.saved.amount).toBe(4900);
    expect(result.saved.pctOfIncome).toBeCloseTo((4900 / 5000) * 100);
  });

  it('returns null trendPct when previous month total is zero', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany
      .mockResolvedValueOnce([{ amount: 1000 }])
      .mockResolvedValueOnce([]); // previous month = 0
    db.expense.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await getSummary(USER_ID);

    expect(result.income.trendPct).toBeNull();
  });

  it('computes a positive trendPct when previous month total is positive', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany
      .mockResolvedValueOnce([{ amount: 1500 }])
      .mockResolvedValueOnce([{ amount: 1000 }]);
    db.expense.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await getSummary(USER_ID);

    expect(result.income.trendPct).toBeCloseTo(50);
  });

  it('returns null pctOfIncome when there is no income this month', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    db.expense.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await getSummary(USER_ID);

    expect(result.saved.pctOfIncome).toBeNull();
  });

  it('sorts category breakdown descending and caps at top 5, falling back missing icon/color', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const categories = Array.from({ length: 6 }, (_, i) => ({
      amount: (i + 1) * 10,
      categoryId: `cat-${i}`,
      category: {
        name: `Cat ${i}`,
        icon: i === 0 ? null : 'pi-tag',
        color: i === 0 ? null : '#111111',
      },
    }));
    db.expense.findMany
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([]);

    const result = await getSummary(USER_ID);

    expect(result.categoryBreakdown).toHaveLength(5);
    expect(result.categoryBreakdown[0].name).toBe('Cat 5'); // value=60, highest
    expect(result.categoryBreakdown[0].value).toBe(60);
    // the lowest-value category (Cat 0, value=10, null icon/color) is dropped by the top-5 cap
    expect(
      result.categoryBreakdown.find((c) => c.name === 'Cat 0')
    ).toBeUndefined();
  });

  it('falls back to default icon/color for a category missing them', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    db.expense.findMany
      .mockResolvedValueOnce([
        {
          amount: 42,
          categoryId: 'cat-x',
          category: { name: 'Misc', icon: null, color: null },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await getSummary(USER_ID);

    expect(result.categoryBreakdown[0]).toEqual({
      name: 'Misc',
      icon: 'pi-tag',
      color: '#6b7280',
      value: 42,
    });
  });

  it('sums repeated categories into a single bucket', async () => {
    db.account.findMany.mockResolvedValue([]);
    db.income.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    db.expense.findMany
      .mockResolvedValueOnce([
        {
          amount: 10,
          categoryId: 'cat-1',
          category: { name: 'Food', icon: 'pi-cart', color: '#FF0000' },
        },
        {
          amount: 20,
          categoryId: 'cat-1',
          category: { name: 'Food', icon: 'pi-cart', color: '#FF0000' },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await getSummary(USER_ID);

    expect(result.categoryBreakdown).toHaveLength(1);
    expect(result.categoryBreakdown[0].value).toBe(30);
  });
});

describe('getTrend', () => {
  it('returns 6 buckets for the 6M range with zero-activity months included', async () => {
    db.income.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue([]);

    const result = await getTrend(USER_ID, '6M');

    expect(result).toHaveLength(6);
    expect(result.every((p) => p.income === 0 && p.expenses === 0)).toBe(true);
    expect(result[result.length - 1].month).toBe(dayjs().format('MMM YY'));
  });

  it('returns 12 buckets for the 1Y range', async () => {
    db.income.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue([]);

    const result = await getTrend(USER_ID, '1Y');

    expect(result).toHaveLength(12);
  });

  it('buckets income/expense rows into the correct month by date', async () => {
    const thisMonth = dayjs().startOf('month').add(2, 'day').toDate();
    db.income.findMany.mockResolvedValue([{ amount: 500, date: thisMonth }]);
    db.expense.findMany.mockResolvedValue([{ amount: 200, date: thisMonth }]);

    const result = await getTrend(USER_ID, '6M');

    const currentBucket = result[result.length - 1];
    expect(currentBucket.income).toBe(500);
    expect(currentBucket.expenses).toBe(200);
  });

  it('falls back to the current month only for All range when user has no transactions', async () => {
    db.income.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue([]);
    db.income.findFirst.mockResolvedValue(null);
    db.expense.findFirst.mockResolvedValue(null);

    const result = await getTrend(USER_ID, 'All');

    expect(result).toHaveLength(1);
    expect(result[0].month).toBe(dayjs().format('MMM YY'));
  });

  it('caps the All range lookback at 36 months for very old accounts', async () => {
    db.income.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue([]);
    db.income.findFirst.mockResolvedValue({
      date: dayjs().subtract(10, 'year').toDate(),
    });
    db.expense.findFirst.mockResolvedValue(null);

    const result = await getTrend(USER_ID, 'All');

    expect(result).toHaveLength(36);
  });

  it('uses the earliest of income/expense first-transaction dates when under the cap', async () => {
    db.income.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue([]);
    db.income.findFirst.mockResolvedValue({
      date: dayjs().subtract(4, 'month').toDate(),
    });
    db.expense.findFirst.mockResolvedValue({
      date: dayjs().subtract(7, 'month').toDate(),
    });

    const result = await getTrend(USER_ID, 'All');

    expect(result).toHaveLength(8); // 7 months back through current month inclusive
  });
});
