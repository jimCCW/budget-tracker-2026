import { z } from 'zod';

export const categoryTypeSchema = z.enum(['EXPENSE', 'INCOME']);
export type CategoryType = z.infer<typeof categoryTypeSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: categoryTypeSchema,
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
