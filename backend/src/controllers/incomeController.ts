import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as incomeService from '../services/incomeService';
import { runCatchupThrottled } from '../services/catchupService';

/**
 * GET /api/income — Returns all income records for the authenticated user.
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
    const data = await incomeService.getAll(req.user!.id, { year, month });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/income/:id — Returns a single income record owned by the authenticated user.
 */
export async function getByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await incomeService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/income — Creates an income record and adjusts the linked account balance.
 * Responds 201 with the created income record.
 */
export async function createController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await incomeService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/income/:id — Updates an income record and reconciles the account balance delta.
 */
export async function updateController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await incomeService.update(
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
 * DELETE /api/income/:id — Deletes an income record and reverses the account balance delta.
 */
export async function deleteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await incomeService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
