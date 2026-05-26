import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  code?: string;
  status?: number;
}

/**
 * Global Express error handler. Must be registered last with `app.use(errorHandler)`.
 * If the error carries a `status` and `code` (thrown by the service layer via `appError`),
 * it forwards those directly to the client. All other errors are logged and returned as 500.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.status && err.code) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
