import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as accountService from '../services/accountService';

/**
 * GET /api/accounts/summary — Returns net worth, liquid amount, investment amount, and all accounts.
 */
export async function getSummaryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await accountService.getSummary(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/accounts — Returns all accounts for the authenticated user.
 */
export async function getAllController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await accountService.getAll(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/accounts — Creates a new account for the authenticated user.
 * Responds 201 with the created account.
 */
export async function createController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await accountService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/accounts/:id — Updates a user-owned account.
 * Returns 403 if the account belongs to another user.
 */
export async function updateController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await accountService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/accounts/:id — Deletes a user-owned account.
 * Returns 409 if it is the user's last account.
 */
export async function deleteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await accountService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
