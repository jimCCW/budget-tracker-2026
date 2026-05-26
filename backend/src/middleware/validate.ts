import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Returns an Express middleware that validates `req.body` against the given Zod schema.
 * On success, replaces `req.body` with the parsed (type-safe) data and calls `next()`.
 * On failure, responds 400 with the first validation error message.
 * @param schema - The Zod schema to validate against.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors[0].message,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
