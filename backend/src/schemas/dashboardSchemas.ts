import { z } from 'zod';

export const dashboardTrendQuerySchema = z.object({
  range: z.enum(['6M', '1Y', 'All']).optional().default('1Y'),
});

export type DashboardTrendQuery = z.infer<typeof dashboardTrendQuerySchema>;
