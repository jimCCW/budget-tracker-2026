import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as categoryService from '../services/categoryService';

/**
 * GET /api/categories — Returns default categories + the authenticated user's custom categories.
 */
export async function getAllController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await categoryService.getAll(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/categories — Creates a new custom category for the authenticated user.
 * Responds 201 with the created category.
 */
export async function createController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await categoryService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/categories/:id — Updates a user-owned category.
 * Returns 403 if the category is a default or belongs to another user.
 */
export async function updateController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await categoryService.update(
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
 * DELETE /api/categories/:id — Deletes a user-owned category.
 * Returns 403 for defaults, 409 if expenses are attached.
 */
export async function deleteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await categoryService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
