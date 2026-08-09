jest.mock('../../../src/lib/prisma', () => ({
  prisma: { userSession: { findUnique: jest.fn() } },
}));
jest.mock('jsonwebtoken');

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../src/lib/prisma';
import {
  authMiddleware,
  AuthRequest,
} from '../../../src/middleware/authMiddleware';

const mockVerify = jwt.verify as jest.Mock;
const db = prisma as unknown as {
  userSession: { findUnique: jest.Mock };
};

function makeReq(authHeader?: string): AuthRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as AuthRequest;
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('authMiddleware', () => {
  const validPayload = {
    id: 'user-1',
    email: 'user@example.com',
    sid: 'session-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('calls next() and sets req.user when token is valid and session is active', async () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    db.userSession.findUnique.mockResolvedValue({
      id: 'session-1',
      revokedAt: null,
    });
    const req = makeReq('Bearer valid.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(validPayload);
  });

  it('responds 401 when Authorization header is missing', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing token' },
    });
  });

  it('responds 401 when Authorization header does not start with Bearer', async () => {
    const req = makeReq('Basic sometoken');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('responds 401 when jwt.verify throws (invalid token)', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const req = makeReq('Bearer bad.token');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
    expect(db.userSession.findUnique).not.toHaveBeenCalled();
  });

  it('strips the Bearer prefix and passes only the token to jwt.verify', async () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    db.userSession.findUnique.mockResolvedValue({
      id: 'session-1',
      revokedAt: null,
    });
    const req = makeReq('Bearer my.actual.token');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith('my.actual.token', 'test-secret');
  });

  it('responds 401 when the session does not exist', async () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    db.userSession.findUnique.mockResolvedValue(null);
    const req = makeReq('Bearer valid.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Session has been revoked' },
    });
  });

  it('responds 401 when the session has been revoked', async () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    db.userSession.findUnique.mockResolvedValue({
      id: 'session-1',
      revokedAt: new Date(),
    });
    const req = makeReq('Bearer valid.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Session has been revoked' },
    });
  });

  it('responds 401 without querying the DB when the JWT has no sid claim (pre-migration token)', async () => {
    mockVerify.mockReturnValue({
      id: 'user-1',
      email: 'user@example.com',
    } as unknown as string);
    const req = makeReq('Bearer legacy.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
    expect(db.userSession.findUnique).not.toHaveBeenCalled();
  });

  it('responds 401 instead of throwing when the session lookup itself errors', async () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    db.userSession.findUnique.mockRejectedValue(new Error('DB unavailable'));
    const req = makeReq('Bearer valid.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  });

  it('looks up the session by the sid claim', async () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    db.userSession.findUnique.mockResolvedValue({
      id: 'session-1',
      revokedAt: null,
    });
    const req = makeReq('Bearer valid.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(db.userSession.findUnique).toHaveBeenCalledWith({
      where: { id: 'session-1' },
    });
  });
});
