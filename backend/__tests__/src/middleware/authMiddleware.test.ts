import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authMiddleware,
  AuthRequest,
} from '../../../src/middleware/authMiddleware';

jest.mock('jsonwebtoken');
const mockVerify = jwt.verify as jest.Mock;

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
  const validPayload = { id: 'user-1', email: 'user@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('calls next() and sets req.user when token is valid', () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    const req = makeReq('Bearer valid.token.here');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(validPayload);
  });

  it('responds 401 when Authorization header is missing', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing token' },
    });
  });

  it('responds 401 when Authorization header does not start with Bearer', () => {
    const req = makeReq('Basic sometoken');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('responds 401 when jwt.verify throws (invalid token)', () => {
    mockVerify.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const req = makeReq('Bearer bad.token');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  });

  it('strips the Bearer prefix and passes only the token to jwt.verify', () => {
    mockVerify.mockReturnValue(validPayload as unknown as string);
    const req = makeReq('Bearer my.actual.token');
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith('my.actual.token', 'test-secret');
  });
});
