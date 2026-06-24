jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/lib/prisma';
import {
  getAll,
  getSummary,
  create,
  createDefault,
  update,
  remove,
} from '../../../src/services/accountService';

const db = prisma as unknown as {
  account: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

const USER_ID = 'user-1';

const makeAccount = (overrides: Record<string, unknown> = {}) => ({
  id: 'acc-1',
  userId: USER_ID,
  name: 'Main Account',
  type: 'BANK',
  balance: 1000,
  icon: null,
  color: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('getAll', () => {
  it('queries by userId ordered by createdAt asc', async () => {
    const rows = [makeAccount()];
    db.account.findMany.mockResolvedValue(rows);

    const result = await getAll(USER_ID);

    expect(db.account.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual(rows);
  });
});

describe('getSummary', () => {
  it('computes netWorth, liquidAmount, investmentAmount and creditAmount from account types', async () => {
    const accounts = [
      makeAccount({ type: 'BANK', balance: 2000 }),
      makeAccount({ id: 'acc-2', type: 'CASH', balance: 500 }),
      makeAccount({ id: 'acc-3', type: 'INVESTMENT', balance: 3000 }),
      makeAccount({ id: 'acc-4', type: 'CRYPTO', balance: 1000 }),
      makeAccount({ id: 'acc-5', type: 'CREDIT', balance: -600 }),
    ];
    db.account.findMany.mockResolvedValue(accounts);

    const result = await getSummary(USER_ID);

    // liquidBalance = 2000 + 500 = 2500
    // investmentAmount = 3000 + 1000 = 4000
    // creditDebt = Math.max(-(-600), 0) = 600
    // liquidAmount = 2500 - 600 = 1900
    // netWorth = 2500 + 4000 - 600 = 5900
    expect(result.netWorth).toBe(5900);
    expect(result.liquidAmount).toBe(1900);
    expect(result.investmentAmount).toBe(4000);
    expect(result.creditAmount).toBe(600);
    expect(result.accounts).toEqual(accounts);
  });

  it('treats a CREDIT account with positive balance as zero debt', async () => {
    const accounts = [
      makeAccount({ type: 'BANK', balance: 1000 }),
      makeAccount({ id: 'acc-2', type: 'CREDIT', balance: 100 }),
    ];
    db.account.findMany.mockResolvedValue(accounts);

    const result = await getSummary(USER_ID);

    expect(result.creditAmount).toBe(0);
    expect(result.liquidAmount).toBe(1000);
    expect(result.netWorth).toBe(1000);
  });

  it('returns zero totals when there are no accounts', async () => {
    db.account.findMany.mockResolvedValue([]);

    const result = await getSummary(USER_ID);

    expect(result.netWorth).toBe(0);
    expect(result.liquidAmount).toBe(0);
    expect(result.investmentAmount).toBe(0);
    expect(result.creditAmount).toBe(0);
  });
});

describe('create', () => {
  it('creates an account with provided fields', async () => {
    const created = makeAccount({
      name: 'Savings',
      type: 'BANK',
      balance: 500,
    });
    db.account.create.mockResolvedValue(created);

    const result = await create(USER_ID, {
      name: 'Savings',
      type: 'BANK',
      balance: 500,
    });

    expect(db.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          name: 'Savings',
          type: 'BANK',
          balance: 500,
        }),
      })
    );
    expect(result).toEqual(created);
  });

  it('defaults type to BANK and balance to 0 when not provided', async () => {
    db.account.create.mockResolvedValue(makeAccount());

    await create(USER_ID, { name: 'New Account' });

    expect(db.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'BANK', balance: 0 }),
      })
    );
  });
});

describe('createDefault', () => {
  it('creates a Main Account via the transaction client', async () => {
    const mockTx = {
      account: { create: jest.fn().mockResolvedValue(makeAccount()) },
    };

    await createDefault(USER_ID, mockTx as never);

    expect(mockTx.account.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        name: 'Main Account',
        type: 'BANK',
        balance: 0,
      },
    });
  });
});

describe('update', () => {
  it('throws NOT_FOUND when account does not exist', async () => {
    db.account.findUnique.mockResolvedValue(null);

    await expect(
      update(USER_ID, 'acc-x', { name: 'New' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when account belongs to another user', async () => {
    db.account.findUnique.mockResolvedValue(
      makeAccount({ userId: 'other-user' })
    );

    await expect(
      update(USER_ID, 'acc-1', { name: 'New' })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('updates and returns the account on success', async () => {
    const existing = makeAccount();
    const updated = makeAccount({ name: 'Updated' });
    db.account.findUnique.mockResolvedValue(existing);
    db.account.update.mockResolvedValue(updated);

    const result = await update(USER_ID, 'acc-1', { name: 'Updated' });

    expect(db.account.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'acc-1' } })
    );
    expect(result).toEqual(updated);
  });
});

describe('remove', () => {
  it('throws NOT_FOUND when account does not exist', async () => {
    db.account.findUnique.mockResolvedValue(null);

    await expect(remove(USER_ID, 'acc-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when account belongs to another user', async () => {
    db.account.findUnique.mockResolvedValue(
      makeAccount({ userId: 'other-user' })
    );

    await expect(remove(USER_ID, 'acc-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('throws CONFLICT when it is the only account', async () => {
    db.account.findUnique.mockResolvedValue(makeAccount());
    db.account.count.mockResolvedValue(1);

    await expect(remove(USER_ID, 'acc-1')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('deletes the account and returns { deleted: true }', async () => {
    db.account.findUnique.mockResolvedValue(makeAccount());
    db.account.count.mockResolvedValue(2);
    db.account.delete.mockResolvedValue({});

    const result = await remove(USER_ID, 'acc-1');

    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
    expect(result).toEqual({ deleted: true });
  });
});
