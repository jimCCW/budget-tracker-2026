jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    income: {
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
} from '../../../src/services/incomeService';

const db = prisma as unknown as {
  account: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  income: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

const mockTx = {
  income: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
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
  name: 'Salary',
  isDefault: false,
  ...overrides,
});

const makeIncome = (overrides: Record<string, unknown> = {}) => ({
  id: 'inc-1',
  userId: USER_ID,
  accountId: ACC_ID,
  categoryId: CAT_ID,
  amount: 3000,
  date: new Date('2026-06-15T00:00:00.000Z'),
  month: 6,
  year: 2026,
  note: null,
  account: makeAccount(),
  category: makeCategory(),
  ...overrides,
});

describe('getAll', () => {
  it('queries by userId only when no filters are provided', async () => {
    db.income.findMany.mockResolvedValue([]);

    await getAll(USER_ID);

    expect(db.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    );
  });

  it('filters by year field when only year is provided', async () => {
    db.income.findMany.mockResolvedValue([]);

    await getAll(USER_ID, { year: 2026 });

    expect(db.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID, year: 2026 }),
      })
    );
  });

  it('filters by both year and month fields when both are provided', async () => {
    db.income.findMany.mockResolvedValue([]);

    await getAll(USER_ID, { year: 2026, month: 6 });

    expect(db.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_ID,
          year: 2026,
          month: 6,
        }),
      })
    );
  });

  it('orders results by date descending', async () => {
    db.income.findMany.mockResolvedValue([]);

    await getAll(USER_ID);

    expect(db.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date: 'desc' } })
    );
  });
});

describe('getById', () => {
  it('throws NOT_FOUND when income does not exist', async () => {
    db.income.findUnique.mockResolvedValue(null);

    await expect(getById(USER_ID, 'inc-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when income belongs to another user', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ userId: 'other' }));

    await expect(getById(USER_ID, 'inc-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('returns the income on success', async () => {
    const income = makeIncome();
    db.income.findUnique.mockResolvedValue(income);

    const result = await getById(USER_ID, 'inc-1');
    expect(result).toEqual(income);
  });
});

describe('create', () => {
  it('throws NOT_FOUND when account does not exist', async () => {
    db.account.findUnique.mockResolvedValue(null);

    await expect(
      create(USER_ID, {
        accountId: ACC_ID,
        categoryId: CAT_ID,
        amount: 1000,
        date: '2026-06-15',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('derives month and year from the date and increments account balance', async () => {
    db.account.findUnique.mockResolvedValueOnce(makeAccount());
    db.category.findUnique.mockResolvedValue(makeCategory());
    const created = makeIncome({ amount: 1000, month: 6, year: 2026 });
    mockTx.income.create.mockResolvedValue(created);

    const result = await create(USER_ID, {
      accountId: ACC_ID,
      categoryId: CAT_ID,
      amount: 1000,
      date: '2026-06-15T00:00:00.000Z',
    });

    expect(mockTx.income.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          amount: 1000,
          month: 6,
          year: 2026,
        }),
      })
    );
    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { increment: 1000 } },
    });
    expect(result).toEqual(created);
  });
});

describe('update', () => {
  it('throws NOT_FOUND when income does not exist', async () => {
    db.income.findUnique.mockResolvedValue(null);

    await expect(
      update(USER_ID, 'inc-x', { amount: 500 })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when income belongs to another user', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ userId: 'other' }));

    await expect(
      update(USER_ID, 'inc-1', { amount: 500 })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('does not update account balance when amount and account are unchanged', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ amount: 3000 }));
    mockTx.income.update.mockResolvedValue(makeIncome({ amount: 3000 }));

    await update(USER_ID, 'inc-1', { amount: 3000 });

    expect(mockTx.account.update).not.toHaveBeenCalled();
  });

  it('increments balance by the difference when only the amount increases', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ amount: 3000 }));
    mockTx.income.update.mockResolvedValue(makeIncome({ amount: 3500 }));

    await update(USER_ID, 'inc-1', { amount: 3500 });

    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { increment: 500 } },
    });
  });

  it('reverses old account and applies new account delta when account changes', async () => {
    const NEW_ACC_ID = 'acc-2';
    db.income.findUnique.mockResolvedValue(
      makeIncome({ amount: 3000, accountId: ACC_ID })
    );
    db.account.findUnique.mockResolvedValue(
      makeAccount({ id: NEW_ACC_ID, userId: USER_ID })
    );
    mockTx.income.update.mockResolvedValue(
      makeIncome({ accountId: NEW_ACC_ID, amount: 3000 })
    );

    await update(USER_ID, 'inc-1', { accountId: NEW_ACC_ID });

    // Old account loses the credit (decrement)
    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { decrement: 3000 } },
    });
    // New account gains the credit (increment)
    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: NEW_ACC_ID },
      data: { balance: { increment: 3000 } },
    });
  });

  it('recomputes month and year when date changes', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ amount: 3000 }));
    mockTx.income.update.mockResolvedValue(
      makeIncome({ month: 8, year: 2026 })
    );

    await update(USER_ID, 'inc-1', { date: '2026-08-20T00:00:00.000Z' });

    expect(mockTx.income.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ month: 8, year: 2026 }),
      })
    );
  });
});

describe('remove', () => {
  it('throws NOT_FOUND when income does not exist', async () => {
    db.income.findUnique.mockResolvedValue(null);

    await expect(remove(USER_ID, 'inc-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when income belongs to another user', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ userId: 'other' }));

    await expect(remove(USER_ID, 'inc-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('reverses account balance and deletes income inside a transaction', async () => {
    db.income.findUnique.mockResolvedValue(makeIncome({ amount: 3000 }));

    const result = await remove(USER_ID, 'inc-1');

    // Income removal decrements the balance (reverses the credit)
    expect(mockTx.account.update).toHaveBeenCalledWith({
      where: { id: ACC_ID },
      data: { balance: { decrement: 3000 } },
    });
    expect(mockTx.income.delete).toHaveBeenCalledWith({
      where: { id: 'inc-1' },
    });
    expect(result).toEqual({ deleted: true });
  });
});
