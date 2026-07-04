import { z } from 'zod';

export const activityQuerySchema = z.object({
  type: z.enum(['ALL', 'EXPENSE', 'INCOME']).optional().default('ALL'),
  categoryId: z.string().min(1).optional(),
  startDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'startDate must be a valid date')
    .optional(),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'endDate must be a valid date')
    .optional(),
  search: z.string().min(1).max(200).optional(),
  cursor: z.string().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const activityExportQuerySchema = activityQuerySchema.omit({
  cursor: true,
  pageSize: true,
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type ActivityExportQuery = z.infer<typeof activityExportQuerySchema>;
