jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcrypt');

import { prisma } from '../../../src/lib/prisma';
import bcrypt from 'bcrypt';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../../../src/services/userService';

const db = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  $transaction: jest.Mock;
};
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const USER_ID = 'user-1';
const EMAIL = 'test@example.com';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: USER_ID,
  email: EMAIL,
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  currency: 'SGD',
  language: 'English',
  passwordHash: 'hashed-pw',
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (mockBcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-pw');
  (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
});

describe('getProfile', () => {
  it('throws NOT_FOUND when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(getProfile(USER_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('selects only safe fields, excluding passwordHash', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());

    await getProfile(USER_ID);

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: expect.objectContaining({
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        currency: true,
        language: true,
        createdAt: true,
      }),
    });
    const [[callArgs]] = db.user.findUnique.mock.calls;
    expect(callArgs.select).not.toHaveProperty('passwordHash');
  });
});

describe('updateProfile', () => {
  it('updates firstName, lastName, and name independently', async () => {
    db.user.update.mockResolvedValue(
      makeUser({ name: 'Janie', firstName: 'Jane', lastName: 'Doe' })
    );

    await updateProfile(USER_ID, {
      firstName: 'Jane',
      lastName: 'Doe',
      name: 'Janie',
    });

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: { firstName: 'Jane', lastName: 'Doe', name: 'Janie' },
      })
    );
  });
});

describe('changePassword', () => {
  it('throws NOT_FOUND when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(
      changePassword(USER_ID, { currentPassword: 'x', password: 'y' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN (not UNAUTHORIZED) when the current password is wrong', async () => {
    // FORBIDDEN specifically — a 401 here would trip the frontend's
    // apiClient interceptor into force-signing the user out on a mistyped
    // password, instead of just showing the error and staying on the page.
    db.user.findUnique.mockResolvedValue(makeUser());
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      changePassword(USER_ID, { currentPassword: 'wrong', password: 'new' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('hashes and stores the new password on success', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());
    db.user.update.mockResolvedValue(makeUser());

    const result = await changePassword(USER_ID, {
      currentPassword: 'correct',
      password: 'NewPassw0rd!23',
    });

    expect(mockBcrypt.hash).toHaveBeenCalledWith('NewPassw0rd!23', 10);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { passwordHash: 'new-hashed-pw' },
    });
    expect(result).toMatchObject({ message: 'Password updated successfully.' });
  });
});

describe('deleteAccount', () => {
  function makeTx() {
    return {
      income: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      expense: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      recurringRule: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      account: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      category: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      savingsBase: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      user: { delete: jest.fn().mockResolvedValue(makeUser()) },
    };
  }

  it('throws NOT_FOUND when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(
      deleteAccount(USER_ID, { password: 'x' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN (not UNAUTHORIZED) when the password is wrong', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      deleteAccount(USER_ID, { password: 'wrong' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('deletes owned rows in FK-safe order, then the user, inside one transaction', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());
    const mockTx = makeTx();
    db.$transaction.mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
    );

    const result = await deleteAccount(USER_ID, { password: 'correct' });

    expect(mockTx.income.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(mockTx.expense.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(mockTx.recurringRule.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(mockTx.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(mockTx.category.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(mockTx.savingsBase.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(mockTx.user.delete).toHaveBeenCalledWith({
      where: { id: USER_ID },
    });
    expect(result).toEqual({ deleted: true });
  });

  it('deletes referencing rows before the tables they reference', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());
    const callOrder: string[] = [];
    const mockTx = makeTx();
    for (const [key, model] of Object.entries(mockTx)) {
      const fn = 'deleteMany' in model ? model.deleteMany : model.delete;
      fn.mockImplementation(async () => {
        callOrder.push(key);
        return key === 'user' ? makeUser() : { count: 0 };
      });
    }
    db.$transaction.mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
    );

    await deleteAccount(USER_ID, { password: 'correct' });

    expect(callOrder.indexOf('income')).toBeLessThan(
      callOrder.indexOf('account')
    );
    expect(callOrder.indexOf('expense')).toBeLessThan(
      callOrder.indexOf('account')
    );
    expect(callOrder.indexOf('recurringRule')).toBeLessThan(
      callOrder.indexOf('account')
    );
    expect(callOrder.indexOf('account')).toBeLessThan(
      callOrder.indexOf('user')
    );
    expect(callOrder.indexOf('category')).toBeLessThan(
      callOrder.indexOf('user')
    );
    expect(callOrder.indexOf('user')).toBe(callOrder.length - 1);
  });
});
