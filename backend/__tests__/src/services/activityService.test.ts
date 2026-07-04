jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    income: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/lib/prisma';
import {
  getActivity,
  getActivityForExport,
} from '../../../src/services/activityService';

const db = prisma as unknown as {
  expense: { findMany: jest.Mock; count: jest.Mock };
  income: { findMany: jest.Mock; count: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
  db.expense.count.mockResolvedValue(0);
  db.income.count.mockResolvedValue(0);
  db.expense.findMany.mockResolvedValue([]);
  db.income.findMany.mockResolvedValue([]);
});

const USER_ID = 'user-1';

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: 'cat-1',
  name: 'Food & Dining',
  icon: 'pi-shop',
  color: '#ff0000',
  ...overrides,
});

const makeAccount = (overrides: Record<string, unknown> = {}) => ({
  id: 'acc-1',
  name: 'Main bank',
  ...overrides,
});

const makeExpenseRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'exp-1',
  userId: USER_ID,
  amount: 50,
  description: 'Lunch',
  date: new Date('2026-01-05T00:00:00.000Z'),
  createdAt: new Date('2026-01-05T00:00:00.000Z'),
  recurringRuleId: null,
  category: makeCategory(),
  account: makeAccount(),
  ...overrides,
});

const makeIncomeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'inc-1',
  userId: USER_ID,
  amount: 5200,
  note: 'Salary',
  date: new Date('2026-01-04T00:00:00.000Z'),
  createdAt: new Date('2026-01-04T00:00:00.000Z'),
  recurringRuleId: null,
  category: makeCategory({ id: 'cat-2', name: 'Income', color: '#00ff00' }),
  account: makeAccount(),
  ...overrides,
});

function encodeCursor(item: { date: string; createdAt: string; id: string }) {
  return Buffer.from(JSON.stringify(item)).toString('base64');
}

describe('getActivity', () => {
  it('merges Expense and Income rows sorted by date desc', async () => {
    db.expense.findMany.mockResolvedValue([
      makeExpenseRow({
        id: 'exp-1',
        date: new Date('2026-01-05T00:00:00.000Z'),
      }),
      makeExpenseRow({
        id: 'exp-2',
        date: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);
    db.income.findMany.mockResolvedValue([
      makeIncomeRow({
        id: 'inc-1',
        date: new Date('2026-01-03T00:00:00.000Z'),
      }),
    ]);

    const result = await getActivity(USER_ID, {}, undefined, 10);

    expect(result.items.map((i) => i.id)).toEqual(['exp-1', 'inc-1', 'exp-2']);
    expect(result.items[0].type).toBe('EXPENSE');
    expect(result.items[1].type).toBe('INCOME');
  });

  it('sets hasNextPage and nextCursor when more rows exist than pageSize', async () => {
    db.expense.findMany.mockResolvedValue([
      makeExpenseRow({
        id: 'exp-1',
        date: new Date('2026-01-05T00:00:00.000Z'),
      }),
      makeExpenseRow({
        id: 'exp-2',
        date: new Date('2026-01-03T00:00:00.000Z'),
      }),
      makeExpenseRow({
        id: 'exp-3',
        date: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);
    db.income.findMany.mockResolvedValue([
      makeIncomeRow({
        id: 'inc-1',
        date: new Date('2026-01-04T00:00:00.000Z'),
      }),
    ]);

    const result = await getActivity(USER_ID, {}, undefined, 2);

    expect(result.items.map((i) => i.id)).toEqual(['exp-1', 'inc-1']);
    expect(result.hasNextPage).toBe(true);
    expect(result.nextCursor).not.toBeNull();
  });

  it('reports no next page when exactly pageSize items exist total', async () => {
    db.expense.findMany.mockResolvedValue([
      makeExpenseRow({
        id: 'exp-1',
        date: new Date('2026-01-05T00:00:00.000Z'),
      }),
    ]);
    db.income.findMany.mockResolvedValue([
      makeIncomeRow({
        id: 'inc-1',
        date: new Date('2026-01-04T00:00:00.000Z'),
      }),
    ]);

    const result = await getActivity(USER_ID, {}, undefined, 2);

    expect(result.items).toHaveLength(2);
    expect(result.hasNextPage).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('does not query Income at all when type is EXPENSE', async () => {
    await getActivity(USER_ID, { type: 'EXPENSE' }, undefined, 10);

    expect(db.income.findMany).not.toHaveBeenCalled();
    expect(db.income.count).not.toHaveBeenCalled();
    expect(db.expense.findMany).toHaveBeenCalled();
  });

  it('does not query Expense at all when type is INCOME', async () => {
    await getActivity(USER_ID, { type: 'INCOME' }, undefined, 10);

    expect(db.expense.findMany).not.toHaveBeenCalled();
    expect(db.expense.count).not.toHaveBeenCalled();
    expect(db.income.findMany).toHaveBeenCalled();
  });

  it('applies categoryId, date range, and search to the where clause', async () => {
    await getActivity(
      USER_ID,
      {
        categoryId: 'cat-1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        search: 'lunch',
      },
      undefined,
      10
    );

    expect(db.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_ID,
          categoryId: 'cat-1',
          date: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          description: { contains: 'lunch', mode: 'insensitive' },
        }),
      })
    );
    expect(db.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_ID,
          categoryId: 'cat-1',
          date: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          note: { contains: 'lunch', mode: 'insensitive' },
        }),
      })
    );
  });

  it('applies a keyset AND/OR condition only when a cursor is provided', async () => {
    const cursor = encodeCursor({
      date: '2026-01-05T00:00:00.000Z',
      createdAt: '2026-01-05T00:00:00.000Z',
      id: 'exp-1',
    });

    await getActivity(USER_ID, {}, cursor, 10);

    const call = db.expense.findMany.mock.calls[0][0];
    expect(call.where.AND).toBeDefined();
    expect(call.where.AND[1].OR).toBeDefined();
  });

  it('throws VALIDATION_ERROR for a malformed cursor', async () => {
    await expect(
      getActivity(USER_ID, {}, 'not-a-valid-cursor!!', 10)
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('derives isRecurring from recurringRuleId', async () => {
    db.expense.findMany.mockResolvedValue([
      makeExpenseRow({ id: 'exp-1', recurringRuleId: 'rule-1' }),
    ]);

    const result = await getActivity(
      USER_ID,
      { type: 'EXPENSE' },
      undefined,
      10
    );

    expect(result.items[0].isRecurring).toBe(true);
  });

  it('computes total and totalPages from both tables counts', async () => {
    db.expense.count.mockResolvedValue(7);
    db.income.count.mockResolvedValue(3);

    const result = await getActivity(USER_ID, {}, undefined, 5);

    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(2);
  });
});

describe('getActivityForExport', () => {
  it('returns the full merged+sorted set without slicing', async () => {
    db.expense.findMany.mockResolvedValue([
      makeExpenseRow({
        id: 'exp-1',
        date: new Date('2026-01-05T00:00:00.000Z'),
      }),
      makeExpenseRow({
        id: 'exp-2',
        date: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);
    db.income.findMany.mockResolvedValue([
      makeIncomeRow({
        id: 'inc-1',
        date: new Date('2026-01-03T00:00:00.000Z'),
      }),
    ]);

    const result = await getActivityForExport(USER_ID, {});

    expect(result.map((i) => i.id)).toEqual(['exp-1', 'inc-1', 'exp-2']);
    expect(db.expense.findMany.mock.calls[0][0].take).toBeUndefined();
  });
});
