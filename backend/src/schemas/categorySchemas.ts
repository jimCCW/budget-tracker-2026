import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be at most 50 characters'),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME']).optional(),
});

export const updateCategorySchema = createCategorySchema;
