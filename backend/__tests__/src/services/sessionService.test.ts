jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    userSession: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/lib/prisma';
import {
  listSessions,
  revokeSession,
  revokeAllSessions,
} from '../../../src/services/sessionService';

const db = prisma as unknown as {
  userSession: { findMany: jest.Mock; updateMany: jest.Mock };
};

const USER_ID = 'user-1';
const CURRENT_SID = 'session-current';
const OTHER_SID = 'session-other';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listSessions', () => {
  it('only queries non-revoked sessions for the given user', async () => {
    db.userSession.findMany.mockResolvedValue([]);

    await listSessions(USER_ID, CURRENT_SID);

    expect(db.userSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, revokedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('flags the session matching currentSessionId as current and labels the device', async () => {
    db.userSession.findMany.mockResolvedValue([
      {
        id: CURRENT_SID,
        userAgent: 'Mozilla/5.0 Chrome/120.0 Windows',
        createdAt: new Date('2026-01-02'),
      },
      {
        id: OTHER_SID,
        userAgent: null,
        createdAt: new Date('2026-01-01'),
      },
    ]);

    const result = await listSessions(USER_ID, CURRENT_SID);

    expect(result).toEqual([
      {
        id: CURRENT_SID,
        device: 'Chrome · Windows',
        createdAt: new Date('2026-01-02'),
        current: true,
      },
      {
        id: OTHER_SID,
        device: 'Unknown device',
        createdAt: new Date('2026-01-01'),
        current: false,
      },
    ]);
  });
});

describe('revokeSession', () => {
  it("throws CONFLICT when revoking the caller's own current session", async () => {
    await expect(
      revokeSession(USER_ID, CURRENT_SID, CURRENT_SID)
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(db.userSession.updateMany).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when no matching active session is owned by this user', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      revokeSession(USER_ID, OTHER_SID, CURRENT_SID)
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('revokes an owned, active, non-current session', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await revokeSession(USER_ID, OTHER_SID, CURRENT_SID);

    expect(db.userSession.updateMany).toHaveBeenCalledWith({
      where: { id: OTHER_SID, userId: USER_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toEqual({ revoked: true });
  });
});

describe('revokeAllSessions', () => {
  it('revokes every active session for the user, including the current one', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 2 });

    const result = await revokeAllSessions(USER_ID);

    expect(db.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toBe(2);
  });

  it('runs on a provided transaction client instead of the default one when given', async () => {
    const mockTx = {
      userSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };

    const result = await revokeAllSessions(
      USER_ID,
      mockTx as unknown as Parameters<typeof revokeAllSessions>[1]
    );

    expect(mockTx.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.userSession.updateMany).not.toHaveBeenCalled();
    expect(result).toBe(1);
  });
});
