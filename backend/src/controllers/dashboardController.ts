import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import * as dashboardService from '../services/dashboardService';
import { dashboardTrendQuerySchema } from '../schemas/dashboardSchemas';

/**
 * GET /api/dashboard/summary — Returns stat-tile figures (balance, current-month
 * income/expense/saved with trend %) and the current month's top expense
 * categories for the authenticated user.
 */
export async function getSummaryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await dashboardService.getSummary(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/trend?range=6M|1Y|All — Returns a monthly income/expense
 * time series for the cashflow chart. Query param: range.
 */
export async function getTrendController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = dashboardTrendQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
    }
    const data = await dashboardService.getTrend(
      req.user!.id,
      parsed.data.range
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
