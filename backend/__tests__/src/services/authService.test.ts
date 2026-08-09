jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

import { prisma } from '../../../src/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  register,
  activateAccount,
  resendActivation,
  login,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../../../src/services/authService';

const db = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  userSession: {
    create: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
  (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
  (mockJwt.sign as jest.Mock).mockReturnValue('mock-token');
});

const USER_ID = 'user-1';
const EMAIL = 'test@example.com';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: USER_ID,
  email: EMAIL,
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  passwordHash: 'hashed-pw',
  isActive: true,
  activationCode: null,
  activationCodeExpiry: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('register', () => {
  it('throws CONFLICT when email is already registered', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());

    await expect(
      register({
        email: EMAIL,
        password: 'pass',
        name: 'Test',
        firstName: 'Test',
        lastName: 'User',
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('hashes the password and creates user + default account in a transaction', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const mockTx = {
      user: {
        create: jest.fn().mockResolvedValue(makeUser({ isActive: false })),
      },
      account: { create: jest.fn().mockResolvedValue({}) },
    };
    db.$transaction.mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
    );

    await register({
      email: EMAIL,
      password: 'secret',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(mockBcrypt.hash).toHaveBeenCalledWith('secret', 10);
    expect(mockTx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: EMAIL,
          passwordHash: 'hashed-pw',
          isActive: false,
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
        }),
      })
    );
    expect(mockTx.account.create).toHaveBeenCalled();
  });

  it('returns { email } on success', async () => {
    db.user.findUnique.mockResolvedValue(null);
    const mockTx = {
      user: { create: jest.fn().mockResolvedValue(makeUser()) },
      account: { create: jest.fn().mockResolvedValue({}) },
    };
    db.$transaction.mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
    );

    const result = await register({
      email: EMAIL,
      password: 'pass',
      name: 'Test',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(result).toEqual({ email: EMAIL });
  });
});

describe('activateAccount', () => {
  it('throws NOT_FOUND when account does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(
      activateAccount({ email: EMAIL, code: '12345' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('returns success message idempotently when already active', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ isActive: true }));

    const result = await activateAccount({ email: EMAIL, code: '12345' });
    expect(result).toMatchObject({ message: 'Account already activated.' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('throws VALIDATION_ERROR for wrong code', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        isActive: false,
        activationCode: '99999',
        activationCodeExpiry: new Date(Date.now() + 60000),
      })
    );

    await expect(
      activateAccount({ email: EMAIL, code: '11111' })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws VALIDATION_ERROR when code is expired', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        isActive: false,
        activationCode: '12345',
        activationCodeExpiry: new Date(Date.now() - 1000),
      })
    );

    await expect(
      activateAccount({ email: EMAIL, code: '12345' })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('activates account and clears code fields on success', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        isActive: false,
        activationCode: '12345',
        activationCodeExpiry: new Date(Date.now() + 60000),
      })
    );
    db.user.update.mockResolvedValue(makeUser());

    const result = await activateAccount({ email: EMAIL, code: '12345' });

    expect(db.user.update).toHaveBeenCalledWith({
      where: { email: EMAIL },
      data: {
        isActive: true,
        activationCode: null,
        activationCodeExpiry: null,
      },
    });
    expect(result).toMatchObject({ message: 'Account activated.' });
  });
});

describe('resendActivation', () => {
  it('throws NOT_FOUND when account does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(resendActivation({ email: EMAIL })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws CONFLICT when account is already active', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ isActive: true }));

    await expect(resendActivation({ email: EMAIL })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('updates activationCode and activationCodeExpiry on success', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));
    db.user.update.mockResolvedValue(makeUser());

    const result = await resendActivation({ email: EMAIL });

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: EMAIL },
        data: expect.objectContaining({
          activationCode: expect.any(String),
          activationCodeExpiry: expect.any(Date),
        }),
      })
    );
    expect(result).toEqual({ email: EMAIL });
  });
});

describe('login', () => {
  it('throws UNAUTHORIZED when email is not found', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(
      login({ email: EMAIL, password: 'pass' })
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('throws FORBIDDEN when account is not active', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));

    await expect(
      login({ email: EMAIL, password: 'pass' })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('throws UNAUTHORIZED when password does not match', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ isActive: true }));
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      login({ email: EMAIL, password: 'wrong' })
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('opens a UserSession and signs a JWT carrying its id as sid', async () => {
    const user = makeUser({
      isActive: true,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
    });
    db.user.findUnique.mockResolvedValue(user);
    db.userSession.create.mockResolvedValue({ id: 'session-1' });

    const result = await login(
      { email: EMAIL, password: 'correct' },
      { userAgent: 'Chrome/120.0 Windows' }
    );

    expect(db.userSession.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, userAgent: 'Chrome/120.0 Windows' },
    });
    expect(mockJwt.sign).toHaveBeenCalledWith(
      { id: USER_ID, email: EMAIL, sid: 'session-1' },
      'test-secret',
      { expiresIn: '7d' }
    );
    expect(result).toMatchObject({
      token: 'mock-token',
      id: USER_ID,
      email: EMAIL,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
    });
  });
});

describe('logout', () => {
  it('revokes only the matching, not-already-revoked session', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 1 });

    await logout('session-1');

    expect(db.userSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('does not throw when the session is already revoked (idempotent)', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(logout('session-1')).resolves.toBeUndefined();
  });
});

describe('forgotPassword', () => {
  it('silently returns when email is not found (no throw, no DB write)', async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(forgotPassword({ email: EMAIL })).resolves.toBeUndefined();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('hashes a reset token and stores it when user is found', async () => {
    db.user.findUnique.mockResolvedValue(makeUser());
    db.user.update.mockResolvedValue(makeUser());

    await forgotPassword({ email: EMAIL });

    expect(mockBcrypt.hash).toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: EMAIL },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      })
    );
  });
});

describe('verifyResetToken', () => {
  it('throws VALIDATION_ERROR when user has no reset token', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ resetToken: null }));

    await expect(
      verifyResetToken({ email: EMAIL, token: 'tok' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('throws VALIDATION_ERROR when reset token is expired', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        resetToken: 'hash',
        resetTokenExpiry: new Date(Date.now() - 1000),
      })
    );

    await expect(
      verifyResetToken({ email: EMAIL, token: 'tok' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('throws VALIDATION_ERROR when token does not match the stored hash', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        resetToken: 'hash',
        resetTokenExpiry: new Date(Date.now() + 60000),
      })
    );
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      verifyResetToken({ email: EMAIL, token: 'wrong-token' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns { valid: true } when token is valid', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        resetToken: 'hash',
        resetTokenExpiry: new Date(Date.now() + 60000),
      })
    );
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await verifyResetToken({
      email: EMAIL,
      token: 'good-token',
    });
    expect(result).toEqual({ valid: true });
  });
});

describe('resetPassword', () => {
  it('propagates errors from verifyResetToken', async () => {
    db.user.findUnique.mockResolvedValue(makeUser({ resetToken: null }));

    await expect(
      resetPassword({ email: EMAIL, token: 'tok', password: 'newpass' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('hashes the new password and clears reset token fields', async () => {
    db.user.findUnique.mockResolvedValue(
      makeUser({
        resetToken: 'hash',
        resetTokenExpiry: new Date(Date.now() + 60000),
      })
    );
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    db.user.update.mockResolvedValue(makeUser());

    const result = await resetPassword({
      email: EMAIL,
      token: 'tok',
      password: 'newpass',
    });

    expect(mockBcrypt.hash).toHaveBeenCalledWith('newpass', 10);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { email: EMAIL },
      data: {
        passwordHash: 'hashed-pw',
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    expect(result).toMatchObject({ message: 'Password updated successfully.' });
  });
});
