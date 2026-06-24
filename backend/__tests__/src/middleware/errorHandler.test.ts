import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { appError } from '../../../src/utils/appError';

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const req = {} as Request;
const next = jest.fn() as NextFunction;

describe('errorHandler', () => {
  it('maps an AppError to the correct status and error shape', () => {
    const err = appError('NOT_FOUND', 'Resource not found', 404);
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  });

  it('handles 401 UNAUTHORIZED errors', () => {
    const err = appError('UNAUTHORIZED', 'Missing token', 401);
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing token' },
    });
  });

  it('handles 409 CONFLICT errors', () => {
    const err = appError('CONFLICT', 'Email already registered', 409);
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('falls back to 500 INTERNAL_ERROR for plain Error instances', () => {
    const err = new Error('Unexpected failure');
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  it('falls back to 500 for errors without a status code', () => {
    const err = Object.assign(new Error('no status'), { code: 'SOME_CODE' });
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
