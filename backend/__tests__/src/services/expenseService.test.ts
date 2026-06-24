jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../../../src/lib/prisma';
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../../../src/services/expenseService';

const db = prisma as unknown as {
  account: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  expense: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

const mockTx = {
  expense: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  account: { update: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  db.$transaction.mockImplementation(
    (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
  );
});

const USER_ID = 'user-1';
const ACC_ID = 'acc-1';
const CAT_ID = 'cat-1';

const makeAccount = (overrides: Record<string, unknown> = {}) => ({
  id: ACC_ID,
  userId: USER_ID,
  name: 'Main',
  type: 'BANK',
  balance: 5000,
  ...overrides,
});

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: CAT_ID,
  userId: USER_ID,
  name: 'Food',
  isDefault: false,
  ...overrides,
});

const makeExpense = (overrides: Record<string, unknown> = {}) => ({
  id: 'exp-1',
  userId: USER_ID,
  accountId: ACC_ID,
  categoryId: CAT_ID,
  amount: 100,
  date: new Date('2026-06-01T00:00:00.000Z'),
  description: null,
  account: makeAccount(),
  category: makeCategory(),
  ...overrides,
});

describe('getAll', () => {
  it('queries by userId only when no filters are provided', async () => {
    db.expense.findMany.mockResolvedValue([]);

    await getAll(USER_ID);

    expect(db.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    );
  });

  it('applies a UTC date range filter when year and month are provided', async () => {
    db.expense.findMany.mockResolvedValue([]);

    await getAll(USER_ID, { year: 2026, month: 6 });

    expect(db.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_ID,
          date: {
            gte: new Date('2026-06-01T00:00:00.000Z'),
            lte: new Date('2026-06-30T23:59:59.999Z'),
          },
        }),
      })
    );
  });

  it('applies Jan 1 to Dec 31 range when only year is provided', async () => {
    db.expense.findMany.mockResolvedValue([]);

    await getAll(USER_ID, { year: 2026 });

    expect(db.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lte: new Date('2026-12-31T23:59:59.999Z'),
          },
        }),
      })
    );
  });

  it('orders results by date descending', async () => {
    db.expense.findMany.mockResolvedValue([]);

    await getAll(USER_ID);

    expect(db.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date: 'desc' } })
    );
  });
});

describe('getById', () => {
  it('throws NOT_FOUND when expense does not exist', async () => {
    db.expense.findUnique.mockResolvedValue(null);

    await expect(getById(USER_ID, 'exp-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when expense belongs to another user', async () => {
    db.expense.findUnique.mockResolvedValue(makeExpense({ userId: 'other' }));

    await expect(getById(USER_ID, 'exp-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('returns the expense on success', async () => {
    const expense = makeExpense();
    db.expense.findUnique.mockResolvedValue(expense);

    const result = await getById(USER_ID, 'exp-1');
    expect(result).toEqual(expense);
  });
});

describe('create', () => {
  it('throws NOT_FOUND when account does not exist', async () => {
    db.account.findUnique.mockResolvedValue(null);

    await expect(
      create(USER_ID, {
        accountId: ACC_ID,
        categoryId: CAT_ID,
        amount: 50,
        date: '2026-06-01',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN when account belongs to another user', async () => {
    db.account.findUnique.mockResolvedValue(makeAccount({ userId: 'other' }));

    await expect(
      create(USER_ID, {
        accountId: ACC_ID,
        categoryId: CAT_ID,
        amount: 50,
        date: '2026-06-01',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('creates expense and decrements account balance inside a transaction', async () => {
    db.account.findUnique.mockResolvedValueOnce(makeAccount());
    db.category.findUnique.mockResolvedValue(makeCategory());
    const created = makeExpense({ amount: 150 });
    mockTx.expense.create.mockResolvedValue(created);

    const result = await create(USER_ID, {
      accountId: ACC_ID,
      categoryId: CAT_ID,
      amount: 150,
      date: '2026-06-01',
    });

    expect(mockTx.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, amount: 150 }),
      })
    );
    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { decrement: 150 } },
    });
    expect(result).toEqual(created);
  });
});

describe('update', () => {
  it('throws NOT_FOUND when expense does not exist', async () => {
    db.expense.findUnique.mockResolvedValue(null);

    await expect(
      update(USER_ID, 'exp-x', { amount: 200 })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when expense belongs to another user', async () => {
    db.expense.findUnique.mockResolvedValue(makeExpense({ userId: 'other' }));

    await expect(
      update(USER_ID, 'exp-1', { amount: 200 })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('does not update account balance when amount and account are unchanged', async () => {
    db.expense.findUnique.mockResolvedValue(makeExpense({ amount: 100 }));
    mockTx.expense.update.mockResolvedValue(makeExpense({ amount: 100 }));

    await update(USER_ID, 'exp-1', { amount: 100 });

    expect(mockTx.account.update).not.toHaveBeenCalled();
  });

  it('decrements the balance by the amount difference when only the amount increases', async () => {
    db.expense.findUnique.mockResolvedValue(makeExpense({ amount: 100 }));
    mockTx.expense.update.mockResolvedValue(makeExpense({ amount: 150 }));

    await update(USER_ID, 'exp-1', { amount: 150 });

    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { decrement: 50 } },
    });
  });

  it('reverses old account and applies new account delta when account changes', async () => {
    const NEW_ACC_ID = 'acc-2';
    db.expense.findUnique.mockResolvedValue(
      makeExpense({ amount: 100, accountId: ACC_ID })
    );
    db.account.findUnique.mockResolvedValue(
      makeAccount({ id: NEW_ACC_ID, userId: USER_ID })
    );
    mockTx.expense.update.mockResolvedValue(
      makeExpense({ accountId: NEW_ACC_ID, amount: 100 })
    );

    await update(USER_ID, 'exp-1', { accountId: NEW_ACC_ID });

    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { increment: 100 } },
    });
    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: NEW_ACC_ID },
      data: { balance: { decrement: 100 } },
    });
  });
});

describe('remove', () => {
  it('throws NOT_FOUND when expense does not exist', async () => {
    db.expense.findUnique.mockResolvedValue(null);

    await expect(remove(USER_ID, 'exp-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when expense belongs to another user', async () => {
    db.expense.findUnique.mockResolvedValue(makeExpense({ userId: 'other' }));

    await expect(remove(USER_ID, 'exp-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('restores account balance and deletes expense inside a transaction', async () => {
    db.expense.findUnique.mockResolvedValue(makeExpense({ amount: 200 }));

    const result = await remove(USER_ID, 'exp-1');

    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { increment: 200 } },
    });
    expect(mockTx.expense.delete).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
    });
    expect(result).toEqual({ deleted: true });
  });
});
