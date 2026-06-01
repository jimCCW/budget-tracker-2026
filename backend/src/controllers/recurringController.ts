import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as recurringService from '../services/recurringService';
import { materializeDueTransactions } from '../services/recurrenceEngine';

/**
 * GET /api/recurring — Returns all recurring rules for the authenticated user.
 */
export async function getAllController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await recurringService.getAll(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/recurring/:id — Returns a single recurring rule owned by the authenticated user.
 */
export async function getByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await recurringService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/recurring — Creates a recurring rule and materialises any due occurrences.
 * Responds 201 with the created rule.
 */
export async function createController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await recurringService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/recurring/:id — Updates a recurring rule's non-structural fields.
 */
export async function updateController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await recurringService.update(
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
 * PATCH /api/recurring/:id/active — Pauses or resumes a recurring rule.
 * Expects body: { isActive: boolean }
 */
export async function setActiveController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await recurringService.setActive(
      req.user!.id,
      req.params.id,
      req.body.isActive
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/recurring/catchup — Materialises all due recurring occurrences for the authenticated user.
 * Responds 200 with `{ created }` — number of new transaction records written.
 */
export async function catchupController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await materializeDueTransactions(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/recurring/:id — Deletes a recurring rule; historical transactions are preserved.
 */
export async function deleteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await recurringService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
