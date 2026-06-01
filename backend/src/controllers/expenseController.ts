import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as expenseService from '../services/expenseService';
import { runCatchupThrottled } from '../services/catchupService';

/**
 * GET /api/expenses — Returns all expense records for the authenticated user.
 * Triggers a throttled recurring catch-up before fetching so new occurrences appear immediately.
 * Accepts optional query params: year (number), month (number).
 */
export async function getAllController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await runCatchupThrottled(req.user!.id);
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const data = await expenseService.getAll(req.user!.id, { year, month });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/expenses/:id — Returns a single expense record owned by the authenticated user.
 */
export async function getByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await expenseService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/expenses — Creates an expense record and adjusts the linked account balance.
 * Responds 201 with the created expense record.
 */
export async function createController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await expenseService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/expenses/:id — Updates an expense record and reconciles the account balance delta.
 */
export async function updateController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await expenseService.update(
      req.user!.id,
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/expenses/:id — Deletes an expense record and reverses the account balance delta.
 */
export async function deleteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await expenseService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
