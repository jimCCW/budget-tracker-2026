jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expense: {
      count: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/lib/prisma';
import { getAll, create, remove } from '../../src/services/categoryService';

const db = prisma as unknown as {
  category: {
    findMany: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  expense: { count: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
});

const USER_ID = 'user-1';

describe('getAll', () => {
  it('queries both default categories and user categories', async () => {
    const rows = [
      { id: 'cat-1', name: 'Food', isDefault: true },
      { id: 'cat-2', name: 'My Cat', isDefault: false, userId: USER_ID },
    ];
    db.category.findMany.mockResolvedValue(rows);

    const result = await getAll(USER_ID);

    expect(db.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ isDefault: true }, { userId: USER_ID }] },
      })
    );
    expect(result).toEqual(rows);
  });
});

describe('create', () => {
  it('creates a category scoped to the user', async () => {
    const created = { id: 'cat-new', name: 'Transport', userId: USER_ID, isDefault: false };
    db.category.create.mockResolvedValue(created);

    const result = await create(USER_ID, { name: 'Transport', type: 'EXPENSE' });

    expect(db.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, isDefault: false }),
      })
    );
    expect(result).toEqual(created);
  });

  it('defaults type to EXPENSE when not provided', async () => {
    db.category.create.mockResolvedValue({});

    await create(USER_ID, { name: 'Transport' });

    expect(db.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'EXPENSE' }),
      })
    );
  });
});

describe('remove', () => {
  it('throws NOT_FOUND when category does not exist', async () => {
    db.category.findUnique.mockResolvedValue(null);

    await expect(remove(USER_ID, 'cat-x')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN when trying to delete a default category', async () => {
    db.category.findUnique.mockResolvedValue({ id: 'cat-1', isDefault: true, userId: null });

    await expect(remove(USER_ID, 'cat-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('throws FORBIDDEN when category belongs to another user', async () => {
    db.category.findUnique.mockResolvedValue({
      id: 'cat-2',
      isDefault: false,
      userId: 'other-user',
    });

    await expect(remove(USER_ID, 'cat-2')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('throws CONFLICT when category has attached expenses', async () => {
    db.category.findUnique.mockResolvedValue({ id: 'cat-3', isDefault: false, userId: USER_ID });
    db.expense.count.mockResolvedValue(3);

    await expect(remove(USER_ID, 'cat-3')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('deletes category and returns { deleted: true } when valid', async () => {
    db.category.findUnique.mockResolvedValue({ id: 'cat-4', isDefault: false, userId: USER_ID });
    db.expense.count.mockResolvedValue(0);
    db.category.delete.mockResolvedValue({});

    const result = await remove(USER_ID, 'cat-4');

    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-4' } });
    expect(result).toEqual({ deleted: true });
  });
});
