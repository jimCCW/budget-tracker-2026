import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as userService from '../services/userService';

/**
 * GET /api/users/me — Returns the authenticated user's own profile.
 */
export async function getMeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await userService.getProfile(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/me — Updates the authenticated user's first and last name.
 */
export async function updateMeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await userService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/change-password — Changes the authenticated user's password after verifying the current one.
 */
export async function changePasswordController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await userService.changePassword(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/me — Permanently deletes the authenticated user's account and all owned data after verifying their password.
 */
export async function deleteAccountController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await userService.deleteAccount(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
