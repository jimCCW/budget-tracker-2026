import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate';

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number({ invalid_type_error: 'Age must be a number' }).positive(),
});

describe('validate middleware', () => {
  it('calls next() and sets req.body to parsed data when valid', () => {
    const req = { body: { name: 'Alice', age: 30 } } as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('responds 400 with VALIDATION_ERROR when body is invalid', () => {
    const req = { body: { name: '' } } as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
      },
    });
  });

  it('returns the first validation error message', () => {
    const req = { body: { name: '', age: -5 } } as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(typeof jsonArg.error.message).toBe('string');
    expect(jsonArg.error.message.length).toBeGreaterThan(0);
  });

  it('does not call next() on invalid input', () => {
    const req = { body: {} } as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('strips and coerces parsed data (Zod strips extra keys)', () => {
    const req = { body: { name: 'Bob', age: 25, extra: 'ignored' } } as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).not.toHaveProperty('extra');
  });
});
