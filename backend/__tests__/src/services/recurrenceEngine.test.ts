jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    recurringRule: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    expense: { create: jest.fn() },
    income: { create: jest.fn() },
    account: { update: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/recurrence', () => ({
  computeNextRunDate: jest.fn(),
}));

import { prisma } from '../../../src/lib/prisma';
import { computeNextRunDate } from '../../../src/utils/recurrence';
import { materializeDueTransactions } from '../../../src/services/recurrenceEngine';

const db = prisma as unknown as {
  recurringRule: { findMany: jest.Mock; update: jest.Mock };
  expense: { create: jest.Mock };
  income: { create: jest.Mock };
  account: { update: jest.Mock };
  notification: { create: jest.Mock };
  $transaction: jest.Mock;
};

const mockComputeNext = computeNextRunDate as jest.Mock;

const NOW = new Date('2026-06-22T00:00:00.000Z');
// A future date returned by computeNextRunDate so the while-loop runs exactly once
const NEXT_RUN = new Date('2026-07-22T00:00:00.000Z');

const mockTx = {
  expense: { create: jest.fn() },
  income: { create: jest.fn() },
  account: { update: jest.fn() },
  recurringRule: { update: jest.fn() },
};

const USER_ID = 'user-1';

const makeRule = (overrides: Record<string, unknown> = {}) => ({
  id: 'rule-1',
  userId: USER_ID,
  kind: 'EXPENSE',
  amount: 100,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  note: 'Rent',
  frequency: 'MONTHLY',
  interval: 1,
  anchorDay: 1,
  endDate: null,
  nextRunDate: new Date('2026-06-01T00:00:00.000Z'),
  lastRunDate: null,
  isActive: true,
  account: { id: 'acc-1', name: 'DBS Bank' },
  category: { id: 'cat-1', name: 'Rent' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockComputeNext.mockReturnValue(NEXT_RUN);
  db.$transaction.mockImplementation(
    (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
  );
  db.recurringRule.update.mockResolvedValue({});
  db.notification.create.mockResolvedValue({});
  mockTx.expense.create.mockResolvedValue({});
  mockTx.income.create.mockResolvedValue({});
  mockTx.account.update.mockResolvedValue({});
  mockTx.recurringRule.update.mockResolvedValue({});
});

describe('materializeDueTransactions', () => {
  it('returns { created: 0 } and skips transactions when no rules are due', async () => {
    db.recurringRule.findMany.mockResolvedValue([]);

    const result = await materializeDueTransactions(USER_ID, NOW);

    expect(result).toEqual({ created: 0 });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  describe('EXPENSE rule', () => {
    it('creates an expense and decrements account balance inside the transaction', async () => {
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);

      await materializeDueTransactions(USER_ID, NOW);

      expect(mockTx.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_ID,
            accountId: 'acc-1',
            categoryId: 'cat-1',
            amount: 100,
          }),
        })
      );
      expect(mockTx.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: 100 } },
      });
    });

    it('advances nextRunDate inside the transaction', async () => {
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);

      await materializeDueTransactions(USER_ID, NOW);

      expect(mockTx.recurringRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rule-1' },
          data: expect.objectContaining({ nextRunDate: NEXT_RUN }),
        })
      );
    });

    it('creates an EXPENSE_DEBITED notification after the transaction', async () => {
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);

      await materializeDueTransactions(USER_ID, NOW);

      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_ID,
            type: 'EXPENSE_DEBITED',
          }),
        })
      );
    });

    it('returns { created: 1 } after one successful occurrence', async () => {
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);

      const result = await materializeDueTransactions(USER_ID, NOW);

      expect(result).toEqual({ created: 1 });
    });
  });

  describe('INCOME rule', () => {
    it('creates an income record with correct month/year and increments balance', async () => {
      const occurrenceDate = new Date('2026-06-01T00:00:00.000Z');
      db.recurringRule.findMany.mockResolvedValue([
        makeRule({ kind: 'INCOME', nextRunDate: occurrenceDate }),
      ]);

      await materializeDueTransactions(USER_ID, NOW);

      expect(mockTx.income.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_ID,
            amount: 100,
            month: 6,
            year: 2026,
          }),
        })
      );
      expect(mockTx.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { increment: 100 } },
      });
    });

    it('creates an INCOME_CREDITED notification', async () => {
      db.recurringRule.findMany.mockResolvedValue([
        makeRule({ kind: 'INCOME' }),
      ]);

      await materializeDueTransactions(USER_ID, NOW);

      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'INCOME_CREDITED' }),
        })
      );
    });

    it('skips INCOME rule with no categoryId and does not call $transaction', async () => {
      db.recurringRule.findMany.mockResolvedValue([
        makeRule({ kind: 'INCOME', categoryId: null }),
      ]);

      const result = await materializeDueTransactions(USER_ID, NOW);

      expect(db.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0 });
    });
  });

  describe('error handling', () => {
    it('advances nextRunDate without incrementing created on P2002 unique constraint error', async () => {
      const p2002 = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
      });
      db.$transaction.mockRejectedValueOnce(p2002);
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);

      const result = await materializeDueTransactions(USER_ID, NOW);

      expect(db.recurringRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rule-1' },
          data: expect.objectContaining({ nextRunDate: NEXT_RUN }),
        })
      );
      expect(result).toEqual({ created: 0 });
    });

    it('logs and breaks on non-P2002 errors without incrementing created', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      db.$transaction.mockRejectedValueOnce(new Error('DB unavailable'));
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);

      const result = await materializeDueTransactions(USER_ID, NOW);

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toEqual({ created: 0 });
      consoleSpy.mockRestore();
    });

    it('swallows notification creation failures and still increments created', async () => {
      db.recurringRule.findMany.mockResolvedValue([makeRule()]);
      db.notification.create.mockRejectedValueOnce(
        new Error('Notification failed')
      );
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await materializeDueTransactions(USER_ID, NOW);

      expect(result).toEqual({ created: 1 });
      consoleSpy.mockRestore();
    });
  });

  describe('loop boundaries', () => {
    it('does not create when nextRunDate is after endDate', async () => {
      db.recurringRule.findMany.mockResolvedValue([
        makeRule({
          nextRunDate: new Date('2026-06-01T00:00:00.000Z'),
          endDate: new Date('2026-05-01T00:00:00.000Z'),
        }),
      ]);

      const result = await materializeDueTransactions(USER_ID, NOW);

      expect(db.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0 });
    });
  });
});
