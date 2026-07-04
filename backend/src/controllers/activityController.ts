import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as activityService from '../services/activityService';
import { runCatchupThrottled } from '../services/catchupService';
import {
  activityQuerySchema,
  activityExportQuerySchema,
} from '../schemas/activitySchemas';
import { buildActivityWorkbook } from '../utils/activityExport';

/**
 * GET /api/activity — Returns one page of the merged Expense+Income activity feed
 * for the authenticated user. Triggers a throttled recurring catch-up first so
 * freshly-materialized recurring transactions appear immediately.
 * Query params: type, categoryId, startDate, endDate, search, cursor, pageSize.
 */
export async function getActivityController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await runCatchupThrottled(req.user!.id);
    const parsed = activityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
    }
    const { cursor, pageSize, ...filters } = parsed.data;
    const data = await activityService.getActivity(
      req.user!.id,
      filters,
      cursor,
      pageSize
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/activity/export — Streams an .xlsx file of the full filtered activity
 * feed (not just the current page) for the authenticated user.
 * Query params: type, categoryId, startDate, endDate, search.
 */
export async function exportActivityController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await runCatchupThrottled(req.user!.id);
    const parsed = activityExportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
    }
    const rows = await activityService.getActivityForExport(
      req.user!.id,
      parsed.data
    );
    const buffer = await buildActivityWorkbook(rows);
    const filename = `activity-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
