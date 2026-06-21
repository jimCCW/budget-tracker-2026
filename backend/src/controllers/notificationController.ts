import { z } from 'zod';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as notificationService from '../services/notificationService';

/**
 * GET /api/notifications — Returns paginated notifications for the authenticated user, newest first.
 * Accepts optional query params: cursor (string), limit (number, max 100).
 */
export async function getNotificationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const cursor = z.string().optional().parse(req.query.cursor);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(100)
      .parse(req.query.limit ?? 100);
    const data = await notificationService.getNotifications(
      req.user!.id,
      cursor,
      limit
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notifications/unread-count — Returns the count of unread notifications for the authenticated user.
 */
export async function getUnreadCountController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/:id/read — Marks a single notification as read.
 * Returns 403 if the notification belongs to another user.
 */
export async function markAsReadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await notificationService.markAsRead(
      req.user!.id,
      req.params.id
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/notifications/read-all — Marks all unread notifications as read for the authenticated user.
 */
export async function markAllAsReadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notifications/:id — Deletes a notification owned by the authenticated user.
 * Returns 403 if the notification belongs to another user.
 */
export async function deleteNotificationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await notificationService.deleteNotification(req.user!.id, req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
