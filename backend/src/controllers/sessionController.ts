import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as sessionService from '../services/sessionService';

/**
 * GET /api/sessions — Lists the authenticated user's active sessions.
 */
export async function listSessionsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await sessionService.listSessions(req.user!.id, req.user!.sid);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sessions/:id/revoke — Revokes one of the user's other active sessions.
 * Returns 409 if the caller tries to revoke their own current session.
 */
export async function revokeSessionController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await sessionService.revokeSession(
      req.user!.id,
      req.params.id,
      req.user!.sid
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
