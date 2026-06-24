jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    category: { findUnique: jest.fn() },
    recurringRule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../../src/services/recurrenceEngine', () => ({
  materializeDueTransactions: jest.fn().mockResolvedValue({ created: 0 }),
}));

import { prisma } from '../../../src/lib/prisma';
import { materializeDueTransactions } from '../../../src/services/recurrenceEngine';
import {
  getAll,
  getById,
  create,
  update,
  setActive,
  remove,
} from '../../../src/services/recurringService';

const db = prisma as unknown as {
  account: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  recurringRule: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const mockMaterialize = materializeDueTransactions as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

const USER_ID = 'user-1';
const ACC_ID = 'acc-1';
const CAT_ID = 'cat-1';
const RULE_ID = 'rule-1';

const makeAccount = (overrides: Record<string, unknown> = {}) => ({
  id: ACC_ID,
  userId: USER_ID,
  name: 'DBS Bank',
  type: 'BANK',
  balance: 5000,
  ...overrides,
});

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: CAT_ID,
  userId: USER_ID,
  name: 'Rent',
  isDefault: false,
  ...overrides,
});

const makeRule = (overrides: Record<string, unknown> = {}) => ({
  id: RULE_ID,
  userId: USER_ID,
  kind: 'EXPENSE',
  amount: 1500,
  accountId: ACC_ID,
  categoryId: CAT_ID,
  note: 'Monthly rent',
  frequency: 'MONTHLY',
  interval: 1,
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: null,
  anchorDay: 1,
  nextRunDate: new Date('2026-07-01T00:00:00.000Z'),
  lastRunDate: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  account: makeAccount(),
  category: makeCategory(),
  ...overrides,
});

describe('getAll', () => {
  it('queries by userId ordered by createdAt desc', async () => {
    db.recurringRule.findMany.mockResolvedValue([]);

    await getAll(USER_ID);

    expect(db.recurringRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});

describe('getById', () => {
  it('throws NOT_FOUND when rule does not exist', async () => {
    db.recurringRule.findUnique.mockResolvedValue(null);

    await expect(getById(USER_ID, 'rule-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when rule belongs to another user', async () => {
    db.recurringRule.findUnique.mockResolvedValue(
      makeRule({ userId: 'other' })
    );

    await expect(getById(USER_ID, RULE_ID)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('returns the rule on success', async () => {
    const rule = makeRule();
    db.recurringRule.findUnique.mockResolvedValue(rule);

    const result = await getById(USER_ID, RULE_ID);
    expect(result).toEqual(rule);
  });
});

describe('create', () => {
  const baseData = {
    kind: 'EXPENSE' as const,
    amount: 1500,
    accountId: ACC_ID,
    categoryId: CAT_ID,
    frequency: 'MONTHLY' as const,
    startDate: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    db.account.findUnique.mockResolvedValue(makeAccount());
    db.category.findUnique.mockResolvedValue(makeCategory());
    db.recurringRule.create.mockResolvedValue(makeRule());
  });

  it('sets anchorDay to the day-of-month for MONTHLY rules', async () => {
    await create(USER_ID, {
      ...baseData,
      startDate: '2026-03-15T00:00:00.000Z',
    });

    expect(db.recurringRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ anchorDay: 15 }),
      })
    );
  });

  it('sets anchorDay to null for non-MONTHLY frequencies', async () => {
    await create(USER_ID, { ...baseData, frequency: 'WEEKLY' });

    expect(db.recurringRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ anchorDay: null }),
      })
    );
  });

  it('calls materializeDueTransactions when startDate is in the past', async () => {
    await create(USER_ID, {
      ...baseData,
      startDate: '2020-01-01T00:00:00.000Z',
    });

    expect(mockMaterialize).toHaveBeenCalledWith(USER_ID);
  });

  it('does not call materializeDueTransactions when startDate is in the future', async () => {
    await create(USER_ID, {
      ...baseData,
      startDate: '2099-01-01T00:00:00.000Z',
    });

    expect(mockMaterialize).not.toHaveBeenCalled();
  });

  it('skips verifyCategoryOwnership when categoryId is not provided', async () => {
    await create(USER_ID, { ...baseData, categoryId: undefined });

    expect(db.category.findUnique).not.toHaveBeenCalled();
  });

  it('returns the created rule', async () => {
    const rule = makeRule();
    db.recurringRule.create.mockResolvedValue(rule);

    const result = await create(USER_ID, baseData);
    expect(result).toEqual(rule);
  });
});

describe('update', () => {
  it('throws NOT_FOUND when rule does not exist', async () => {
    db.recurringRule.findUnique.mockResolvedValue(null);

    await expect(
      update(USER_ID, 'rule-x', { amount: 2000 })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when rule belongs to another user', async () => {
    db.recurringRule.findUnique.mockResolvedValue(
      makeRule({ userId: 'other' })
    );

    await expect(
      update(USER_ID, RULE_ID, { amount: 2000 })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('updates the rule and returns the result without materialising', async () => {
    db.recurringRule.findUnique.mockResolvedValue(makeRule());
    const updated = makeRule({ amount: 2000 });
    db.recurringRule.update.mockResolvedValue(updated);

    const result = await update(USER_ID, RULE_ID, { amount: 2000 });

    expect(mockMaterialize).not.toHaveBeenCalled();
    expect(result).toEqual(updated);
  });
});

describe('setActive', () => {
  it('throws NOT_FOUND when rule does not exist', async () => {
    db.recurringRule.findUnique.mockResolvedValue(null);

    await expect(setActive(USER_ID, 'rule-x', false)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when rule belongs to another user', async () => {
    db.recurringRule.findUnique.mockResolvedValue(
      makeRule({ userId: 'other' })
    );

    await expect(setActive(USER_ID, RULE_ID, false)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('updates isActive to the given value', async () => {
    db.recurringRule.findUnique.mockResolvedValue(makeRule({ isActive: true }));
    db.recurringRule.update.mockResolvedValue(makeRule({ isActive: false }));

    await setActive(USER_ID, RULE_ID, false);

    expect(db.recurringRule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: RULE_ID },
        data: { isActive: false },
      })
    );
  });
});

describe('remove', () => {
  it('throws NOT_FOUND when rule does not exist', async () => {
    db.recurringRule.findUnique.mockResolvedValue(null);

    await expect(remove(USER_ID, 'rule-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when rule belongs to another user', async () => {
    db.recurringRule.findUnique.mockResolvedValue(
      makeRule({ userId: 'other' })
    );

    await expect(remove(USER_ID, RULE_ID)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('deletes the rule and returns { deleted: true }', async () => {
    db.recurringRule.findUnique.mockResolvedValue(makeRule());
    db.recurringRule.delete.mockResolvedValue({});

    const result = await remove(USER_ID, RULE_ID);

    expect(db.recurringRule.delete).toHaveBeenCalledWith({
      where: { id: RULE_ID },
    });
    expect(result).toEqual({ deleted: true });
  });
});
