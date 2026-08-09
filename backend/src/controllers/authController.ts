import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { verifyResetTokenSchema } from '../schemas/authSchemas';
import type { AuthRequest } from '../middleware/authMiddleware';

/**
 * POST /api/auth/register — Creates a new user account and sends an activation code.
 * Responds 201 with `{ email }` on success.
 */
export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/activate — Validates the 5-digit code and marks the account as active.
 * Responds 200 with `{ message }` on success.
 */
export async function activateController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await authService.activateAccount(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend — Issues a fresh activation code for an inactive account.
 * Responds 200 with `{ email }` on success.
 */
export async function resendController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await authService.resendActivation(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login — Authenticates a user and returns a signed JWT.
 * Responds 200 with `{ token, id, email, name }` on success.
 */
export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await authService.login(req.body, {
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout — Revokes the session the caller's JWT was issued for.
 * Responds 200 with `{ message }` regardless of prior state (idempotent).
 */
export async function logoutController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await authService.logout(req.user!.sid);
    res.json({ success: true, data: { message: 'Signed out.' } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password — Triggers a password reset email (or console log in dev).
 * Always responds 200 with a generic message regardless of whether the email exists.
 */
export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await authService.forgotPassword(req.body);
    res.json({
      success: true,
      data: {
        message:
          'If an account exists for that email, a reset link has been sent.',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/verify-reset-token — Checks that a reset token is valid and not expired.
 * Reads `email` and `token` from query params. Responds 200 with `{ valid: true }` on success.
 */
export async function verifyResetTokenController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = verifyResetTokenSchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters.' },
      });
      return;
    }
    const data = await authService.verifyResetToken(result.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password — Validates the reset token and updates the user's password.
 * Responds 200 with `{ message }` on success.
 */
export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await authService.resetPassword(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
